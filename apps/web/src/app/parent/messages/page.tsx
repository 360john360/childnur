'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useConversations, useMessages, useMessagingSocket, useSendMessage, useUnreadCount, useCreateConversation, useKeyPerson } from '@/hooks/use-messaging';
import { useAnnouncements, useMarkAnnouncementRead } from '@/hooks/use-announcements';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useSelectedChild } from '../layout';
import { MessageCircle, Send, ArrowLeft, Paperclip, Check, CheckCheck, File, X, Megaphone, Bell, AlertTriangle } from 'lucide-react';
import { Lightbox, AttachmentPreview, Attachment } from '@/components/ui/lightbox';

export default function ParentMessagesPage() {
    const { selectedChildId, children } = useSelectedChild();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [lightboxAttachment, setLightboxAttachment] = useState<Attachment | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: conversations, isLoading: loadingConversations } = useConversations();
    const { data: messagesData, isLoading: loadingMessages } = useMessages(selectedConversationId);
    const { data: unreadData } = useUnreadCount();
    const { data: keyPerson } = useKeyPerson(selectedChildId);
    const { connected, sendMessage, markAsRead, joinConversation, leaveConversation } = useMessagingSocket();
    const sendMessageMutation = useSendMessage();
    const createConversationMutation = useCreateConversation();

    // Announcements
    const { data: announcements } = useAnnouncements();
    const markAnnouncementReadMutation = useMarkAnnouncementRead();
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const unreadAnnouncements = announcements?.filter(a => !a.isRead) || [];

    // Current user ID from token
    const currentUserId = typeof window !== 'undefined' ?
        JSON.parse(atob(localStorage.getItem('accessToken')?.split('.')[1] || 'eyJzdWIiOiIifQ==')).sub : '';

    const selectedChild = children.find(c => c.id === selectedChildId);

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

    const handleStartConversation = async () => {
        if (!keyPerson || !selectedChildId) return;

        const conversation = await createConversationMutation.mutateAsync({
            staffUserId: keyPerson.id,
            childId: selectedChildId,
        });
        setSelectedConversationId(conversation.id);
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

        e.target.value = '';
    };

    const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

    // Group messages by date
    const groupedMessages = messagesData?.messages?.reduce((groups: Record<string, typeof messagesData.messages>, msg) => {
        const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
        return groups;
    }, {});

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
        <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto">
            {/* Announcements Banner for Parents */}
            {unreadAnnouncements.length > 0 && !selectedConversationId && (
                <div className="mx-4 md:mx-6 mt-4 mb-2">
                    <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Megaphone className="h-5 w-5 text-orange-600" />
                            <span className="font-semibold text-orange-700">
                                {unreadAnnouncements.length} New Announcement{unreadAnnouncements.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {unreadAnnouncements.slice(0, 3).map((announcement) => (
                                <button
                                    key={announcement.id}
                                    onClick={() => {
                                        markAnnouncementReadMutation.mutate(announcement.id);
                                        setSelectedAnnouncement(announcement);
                                    }}
                                    className="w-full text-left p-3 bg-white/50 rounded-lg border border-orange-500/20 hover:bg-white/80 transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-1.5 rounded ${getPriorityColor(announcement.priority)}`}>
                                            {announcement.priority === 'URGENT' || announcement.priority === 'HIGH' ? (
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                            ) : (
                                                <Bell className="h-3.5 w-3.5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-sm">{announcement.title}</span>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {announcement.content}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {unreadAnnouncements.length > 3 && (
                                <p className="text-xs text-center text-muted-foreground">
                                    +{unreadAnnouncements.length - 3} more
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 md:p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
                            <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Messages</h1>
                            <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-600' : 'text-amber-600'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                                {connected ? 'Connected' : 'Connecting...'}
                            </div>
                        </div>
                    </div>
                    {unreadData?.unreadCount ? (
                        <span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded-full">
                            {unreadData.unreadCount} new
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Key Person Card - show when not in a conversation */}
            {keyPerson && !selectedConversationId && (
                <div className="mx-4 md:mx-6 mt-4 p-4 bg-card rounded-2xl border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                                {keyPerson.firstName[0]}{keyPerson.lastName[0]}
                            </div>
                            <div>
                                <div className="font-semibold text-lg">{keyPerson.firstName} {keyPerson.lastName}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <span className="w-2 h-2 bg-primary rounded-full" />
                                    {selectedChild?.firstName}'s Key Person
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleStartConversation}
                            disabled={createConversationMutation.isPending}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium shadow-lg shadow-primary/20 transition-all"
                        >
                            <MessageCircle className="h-5 w-5" />
                            Message
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {loadingConversations ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                            <p className="text-muted-foreground">Loading conversations...</p>
                        </div>
                    </div>
                ) : !selectedConversationId ? (
                    /* Conversation List */
                    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-3">
                        {conversations?.length === 0 && !keyPerson ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <h2 className="text-lg font-semibold mb-2">No messages yet</h2>
                                <p className="text-muted-foreground">
                                    {selectedChild?.firstName ?
                                        `You'll be able to message ${selectedChild.firstName}'s key person once assigned` :
                                        'Select a child to see messaging options'
                                    }
                                </p>
                            </div>
                        ) : (
                            conversations?.map((conv) => {
                                const staffUser = conv.staffUser;
                                const lastMessage = conv.messages[0];
                                const isUnread = lastMessage && !lastMessage.readAt && lastMessage.senderId !== currentUserId;

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversationId(conv.id)}
                                        className={`w-full p-4 text-left bg-card rounded-2xl border hover:border-primary/50 transition-all shadow-sm ${isUnread ? 'border-primary/30 bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {staffUser.firstName[0]}{staffUser.lastName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`font-semibold ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                                                        {staffUser.firstName} {staffUser.lastName}
                                                    </span>
                                                    {lastMessage && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
                                                        </span>
                                                    )}
                                                </div>
                                                {conv.child && (
                                                    <div className="text-xs text-primary font-medium mb-1">
                                                        About {conv.child.firstName}
                                                    </div>
                                                )}
                                                {lastMessage && (
                                                    <p className={`text-sm truncate ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                                                        {lastMessage.senderId === currentUserId && (
                                                            <span className="text-primary mr-1">You:</span>
                                                        )}
                                                        {lastMessage.content}
                                                    </p>
                                                )}
                                            </div>
                                            {isUnread && (
                                                <span className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* Chat View */
                    <div className="h-full flex flex-col">
                        {/* Chat Header */}
                        <div className="p-4 border-b bg-card flex items-center gap-3">
                            <button
                                onClick={() => setSelectedConversationId(null)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
                                {selectedConversation?.staffUser.firstName[0]}
                                {selectedConversation?.staffUser.lastName[0]}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">
                                    {selectedConversation?.staffUser.firstName} {selectedConversation?.staffUser.lastName}
                                </h3>
                                {selectedConversation?.child && (
                                    <p className="text-sm text-muted-foreground">
                                        About {selectedConversation.child.firstName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-muted/30 to-background">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                            ) : messagesData?.messages?.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                                    <div>
                                        <div className="text-4xl mb-3">👋</div>
                                        <p className="font-medium">Say hello!</p>
                                        <p className="text-sm">Send a message to start chatting</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groupedMessages && Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                                        <div key={dateKey}>
                                            {/* Date divider */}
                                            <div className="flex items-center gap-4 my-4">
                                                <div className="flex-1 h-px bg-border" />
                                                <span className="text-xs text-muted-foreground px-3 py-1 bg-muted rounded-full">
                                                    {isToday(new Date(dateKey)) ? 'Today' :
                                                        isYesterday(new Date(dateKey)) ? 'Yesterday' :
                                                            format(new Date(dateKey), 'MMM d, yyyy')}
                                                </span>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>

                                            {/* Messages */}
                                            <div className="space-y-3">
                                                {msgs.map((msg) => {
                                                    const isMine = msg.senderId === currentUserId;
                                                    return (
                                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[80%]`}>
                                                                <div className={`rounded-2xl px-4 py-2.5 ${isMine
                                                                    ? 'bg-primary text-white rounded-br-md shadow-lg shadow-primary/10'
                                                                    : 'bg-card border rounded-bl-md shadow-sm'
                                                                    }`}>
                                                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                                                                    {/* Attachments */}
                                                                    {msg.attachmentUrls?.length > 0 && (
                                                                        <div className="mt-2 space-y-1">
                                                                            {msg.attachmentUrls.map((url, i) => (
                                                                                <AttachmentPreview
                                                                                    key={i}
                                                                                    attachment={url}
                                                                                    isMine={isMine}
                                                                                    onClickPreview={(att) => setLightboxAttachment(att)}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className={`flex items-center gap-1 mt-1 text-xs ${isMine ? 'justify-end text-muted-foreground' : 'text-muted-foreground'
                                                                    }`}>
                                                                    <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                                                                    {isMine && (
                                                                        msg.readAt ? (
                                                                            <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                                                        ) : (
                                                                            <Check className="h-3.5 w-3.5" />
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t bg-card">
                            <div className="flex items-end gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <div className="flex-1">
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
                                        className="w-full px-4 py-3 rounded-2xl bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[48px] max-h-32"
                                        style={{ height: Math.min(Math.max(48, messageInput.split('\n').length * 24 + 24), 128) }}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim()}
                                    className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Announcement Detail Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b flex items-start justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
                            <div className="flex items-start gap-3">
                                <div className={`p-2.5 rounded-xl ${getPriorityColor(selectedAnnouncement.priority)}`}>
                                    {selectedAnnouncement.priority === 'URGENT' || selectedAnnouncement.priority === 'HIGH' ? (
                                        <AlertTriangle className="h-5 w-5" />
                                    ) : (
                                        <Bell className="h-5 w-5" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">{selectedAnnouncement.title}</h2>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <span>From {selectedAnnouncement.createdBy.firstName} {selectedAnnouncement.createdBy.lastName}</span>
                                        <span>•</span>
                                        <span>{format(new Date(selectedAnnouncement.publishedAt), 'MMM d, yyyy h:mm a')}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto">
                            <div className="whitespace-pre-wrap text-sm">
                                {selectedAnnouncement.content}
                            </div>
                        </div>
                        <div className="p-4 border-t bg-muted/30">
                            <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedAnnouncement.priority)}`}>
                                    {selectedAnnouncement.priority} Priority
                                </span>
                                <button
                                    onClick={() => setSelectedAnnouncement(null)}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox for viewing files */}
            <Lightbox
                attachment={lightboxAttachment}
                isOpen={!!lightboxAttachment}
                onClose={() => setLightboxAttachment(null)}
            />
        </div>
    );
}
