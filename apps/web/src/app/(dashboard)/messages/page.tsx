'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useConversations, useMessages, useMessagingSocket, useSendMessage, useUnreadCount, useCreateConversation, useParentsList } from '@/hooks/use-messaging';
import { useAnnouncements, useCreateAnnouncement, useMarkAnnouncementRead, useAnnouncementUnreadCount } from '@/hooks/use-announcements';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { Plus, X, Search, Send, Paperclip, File, Check, CheckCheck, ArrowLeft, Megaphone, MessageSquare, AlertTriangle, Bell } from 'lucide-react';
import { Lightbox, AttachmentPreview, Attachment } from '@/components/ui/lightbox';
import { useCurrentUserId } from '@/lib/auth';
import { NewConversationModal, ConversationList, MessageThread } from '@/features/messaging/components';
import { NewAnnouncementModal, AnnouncementDetailModal, AnnouncementsList } from '@/features/announcements/components';
import { getPriorityColor } from '@/features/announcements/utils';
import { groupMessagesByDate } from '@/features/messaging/utils';

export default function MessagesPage() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [lightboxAttachment, setLightboxAttachment] = useState<Attachment | null>(null);
    const [conversationSearch, setConversationSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'messages' | 'announcements'>('messages');
    const [showNewAnnouncementModal, setShowNewAnnouncementModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: conversations, isLoading: loadingConversations } = useConversations();
    const { data: messagesData, isLoading: loadingMessages } = useMessages(selectedConversationId);
    const { data: unreadData } = useUnreadCount();
    const { data: parentsList } = useParentsList();
    const { connected, sendMessage, markAsRead, joinConversation, leaveConversation } = useMessagingSocket();
    const sendMessageMutation = useSendMessage();
    const createConversationMutation = useCreateConversation();

    // Announcements hooks
    const { data: announcements, isLoading: loadingAnnouncements } = useAnnouncements();
    const { data: announcementUnread } = useAnnouncementUnreadCount();
    const createAnnouncementMutation = useCreateAnnouncement();
    const markAnnouncementReadMutation = useMarkAnnouncementRead();

    // Current user ID (using centralized auth utility)
    const currentUserId = useCurrentUserId() || '';

    // Join/leave conversation rooms
    useEffect(() => {
        if (selectedConversationId) {
            joinConversation(selectedConversationId);
            markAsRead(selectedConversationId);
        }
        return () => {
            if (selectedConversationId) {
                leaveConversation(selectedConversationId);
            }
        };
    }, [selectedConversationId, joinConversation, leaveConversation, markAsRead]);

    // Scroll to bottom on new messages
    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [messagesData?.messages?.length]);

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && attachments.length === 0) || !selectedConversationId) return;

        const content = messageInput.trim();
        const attachmentUrls = attachments.map(a => a.url);
        setMessageInput('');
        setAttachments([]);

        if (connected) {
            sendMessage(selectedConversationId, content, attachmentUrls.length > 0 ? attachmentUrls : undefined);
        } else {
            await sendMessageMutation.mutateAsync({
                conversationId: selectedConversationId,
                content,
                attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
            });
        }
    };

    const handleStartConversation = async (parentUserId: string, childId?: string) => {
        const conversation = await createConversationMutation.mutateAsync({
            parentUserId,
            childId,
        });
        setSelectedConversationId(conversation.id);
        setShowNewConversationModal(false);
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const uploadedUrls: string[] = [];

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/messaging/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    setAttachments(prev => [...prev, data]);
                } else {
                    console.error('Upload failed:', await response.text());
                }
            } catch (error) {
                console.error('Upload error:', error);
            }
        }

        // Reset file input
        e.target.value = '';
    };

    const formatMessageDate = (date: Date) => {
        if (isToday(date)) return format(date, 'h:mm a');
        if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
        return format(date, 'MMM d, h:mm a');
    };

    const selectedConversation = conversations?.find(c => c.id === selectedConversationId);


    // Group messages by date
    const groupedMessages = messagesData?.messages?.reduce((groups: Record<string, typeof messagesData.messages>, msg) => {
        const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
        return groups;
    }, {});

    // Handle create announcement (receives data from modal)
    const handleCreateAnnouncement = async (data: { title: string; content: string; priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' }) => {
        await createAnnouncementMutation.mutateAsync({
            title: data.title,
            content: data.content,
            priority: data.priority,
        });
        setShowNewAnnouncementModal(false);
    };

    // Priority color helper
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-500/10 text-red-600 border-red-500/30';
            case 'HIGH': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
            case 'LOW': return 'bg-muted text-muted-foreground border-muted';
            default: return 'bg-primary/10 text-primary border-primary/30';
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar - hidden on mobile when conversation selected */}
            <div className={`w-full md:w-80 bg-card/50 border-r flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {/* Header with tabs */}
                <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                    {/* Tab buttons */}
                    <div className="flex gap-1 mb-3 bg-muted/50 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('messages')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'messages'
                                ? 'bg-background shadow text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <MessageSquare className="h-4 w-4" />
                            <span>Messages</span>
                            {(unreadData?.unreadCount || 0) > 0 && (
                                <span className="px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
                                    {unreadData?.unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('announcements')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'announcements'
                                ? 'bg-background shadow text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Megaphone className="h-4 w-4" />
                            <span>Broadcasts</span>
                            {(announcementUnread?.count || 0) > 0 && (
                                <span className="px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                                    {announcementUnread?.count}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Messages tab header */}
                    {activeTab === 'messages' && (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <div className={`flex items-center gap-2 text-xs px-2.5 py-1 rounded-full w-fit ${connected ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                                    {connected ? 'Live' : 'Connecting...'}
                                </div>
                                <button
                                    onClick={() => setShowNewConversationModal(true)}
                                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all text-xs flex items-center gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    New
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={conversationSearch}
                                    onChange={(e) => setConversationSearch(e.target.value)}
                                    placeholder="Search conversations..."
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-background/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </>
                    )}

                    {/* Announcements tab header */}
                    {activeTab === 'announcements' && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Broadcast to all parents</span>
                            <button
                                onClick={() => setShowNewAnnouncementModal(true)}
                                className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all text-xs flex items-center gap-1"
                            >
                                <Plus className="h-4 w-4" />
                                New
                            </button>
                        </div>
                    )}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Messages list */}
                    {activeTab === 'messages' && (
                        <ConversationList
                            conversations={conversations}
                            isLoading={loadingConversations}
                            currentUserId={currentUserId}
                            selectedConversationId={selectedConversationId}
                            searchQuery={conversationSearch}
                            onConversationClick={setSelectedConversationId}
                            onNewConversationClick={() => setShowNewConversationModal(true)}
                        />
                    )}

                    {/* Announcements list */}
                    {activeTab === 'announcements' && (
                        <AnnouncementsList
                            announcements={announcements}
                            isLoading={loadingAnnouncements}
                            onAnnouncementClick={(announcement) => {
                                if (!announcement.isRead) {
                                    markAnnouncementReadMutation.mutate(announcement.id);
                                }
                                setSelectedAnnouncement(announcement);
                            }}
                            onCreateClick={() => setShowNewAnnouncementModal(true)}
                        />
                    )}
                </div>
            </div>

            {/* Message Thread - full width on mobile */}
            <div className={`flex-1 flex flex-col bg-gradient-to-b from-muted/30 to-background ${selectedConversationId ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Header with back button for mobile */}
                        <div className="p-4 border-b bg-card/80 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                {/* Back button - only on mobile */}
                                <button
                                    onClick={() => setSelectedConversationId(null)}
                                    className="md:hidden p-2 -ml-2 hover:bg-muted rounded-lg"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
                                    {(selectedConversation.staffUserId === currentUserId
                                        ? selectedConversation.parentUser
                                        : selectedConversation.staffUser
                                    ).firstName[0]}
                                    {(selectedConversation.staffUserId === currentUserId
                                        ? selectedConversation.parentUser
                                        : selectedConversation.staffUser
                                    ).lastName[0]}
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-semibold">
                                        {selectedConversation.staffUserId === currentUserId
                                            ? `${selectedConversation.parentUser.firstName} ${selectedConversation.parentUser.lastName}`
                                            : `${selectedConversation.staffUser.firstName} ${selectedConversation.staffUser.lastName}`
                                        }
                                    </h2>
                                    {selectedConversation.child && (
                                        <p className="text-sm text-muted-foreground">
                                            Regarding {selectedConversation.child.firstName} {selectedConversation.child.lastName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* Messages */}
                        <MessageThread
                            messages={messagesData?.messages}
                            groupedMessages={groupedMessages}
                            isLoading={loadingMessages}
                            currentUserId={currentUserId}
                            messagesEndRef={messagesEndRef}
                            onAttachmentClick={setLightboxAttachment}
                        />

                        {/* Input */}
                        <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
                            {/* Attachment Preview */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {attachments.map((att, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
                                            {att.thumbnailUrl ? (
                                                <img src={att.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                            ) : (
                                                <File className="h-4 w-4" />
                                            )}
                                            <span className="max-w-[120px] truncate">{att.originalFilename || `File ${i + 1}`}</span>
                                            <button
                                                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                className="p-0.5 hover:bg-primary/20 rounded"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-end gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    multiple
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                                    title="Attach file"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="w-full px-4 py-3 pr-12 rounded-2xl bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none min-h-[48px] max-h-32"
                                        style={{ height: Math.min(Math.max(48, messageInput.split('\n').length * 24 + 24), 128) }}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!messageInput.trim() && attachments.length === 0) || sendMessageMutation.isPending}
                                    className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-sm">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Send className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
                            <p className="text-muted-foreground mb-6">Select a conversation to start messaging or create a new one</p>
                            <button
                                onClick={() => setShowNewConversationModal(true)}
                                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* New Conversation Modal */}
            <NewConversationModal
                isOpen={showNewConversationModal}
                onClose={() => setShowNewConversationModal(false)}
                parents={parentsList}
                onStartConversation={handleStartConversation}
                isCreating={createConversationMutation.isPending}
            />


            {/* New Announcement Modal */}
            <NewAnnouncementModal
                isOpen={showNewAnnouncementModal}
                onClose={() => setShowNewAnnouncementModal(false)}
                onSubmit={handleCreateAnnouncement}
                isSubmitting={createAnnouncementMutation.isPending}
            />

            {/* Announcement Detail Modal */}
            <AnnouncementDetailModal
                announcement={selectedAnnouncement}
                onClose={() => setSelectedAnnouncement(null)}
            />

            {/* Lightbox for viewing files */}
            <Lightbox
                attachment={lightboxAttachment}
                isOpen={!!lightboxAttachment}
                onClose={() => setLightboxAttachment(null)}
            />
        </div>
    );
}
