'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useConversations, useMessages, useMessagingSocket, useSendMessage, useUnreadCount, useCreateConversation, useParentsList } from '@/hooks/use-messaging';
import { useAnnouncements, useCreateAnnouncement, useMarkAnnouncementRead, useAnnouncementUnreadCount } from '@/hooks/use-announcements';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { Plus, X, Search, Send, Paperclip, File, Check, CheckCheck, ArrowLeft, Megaphone, MessageSquare, AlertTriangle, Bell } from 'lucide-react';
import { Lightbox, AttachmentPreview, Attachment } from '@/components/ui/lightbox';
import { useCurrentUserId } from '@/lib/auth';
import { NewConversationModal } from '@/features/messaging/components';
import { NewAnnouncementModal, AnnouncementDetailModal } from '@/features/announcements/components';
import { getPriorityColor } from '@/features/announcements/utils';
import { groupMessagesByDate } from '@/features/messaging/utils';

export default function MessagesPage() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [parentSearch, setParentSearch] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [lightboxAttachment, setLightboxAttachment] = useState<Attachment | null>(null);
    const [conversationSearch, setConversationSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'messages' | 'announcements'>('messages');
    const [showNewAnnouncementModal, setShowNewAnnouncementModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [announcementPriority, setAnnouncementPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
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

    const filteredParents = parentsList?.filter(p =>
        p.firstName.toLowerCase().includes(parentSearch.toLowerCase()) ||
        p.lastName.toLowerCase().includes(parentSearch.toLowerCase()) ||
        p.children.some(c =>
            c.firstName.toLowerCase().includes(parentSearch.toLowerCase()) ||
            c.lastName.toLowerCase().includes(parentSearch.toLowerCase())
        )
    );

    // Group messages by date
    const groupedMessages = messagesData?.messages?.reduce((groups: Record<string, typeof messagesData.messages>, msg) => {
        const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
        return groups;
    }, {});

    // Handle create announcement
    const handleCreateAnnouncement = async () => {
        if (!announcementTitle.trim() || !announcementContent.trim()) return;

        await createAnnouncementMutation.mutateAsync({
            title: announcementTitle.trim(),
            content: announcementContent.trim(),
            priority: announcementPriority,
        });

        setAnnouncementTitle('');
        setAnnouncementContent('');
        setAnnouncementPriority('NORMAL');
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
                        <>
                            {loadingConversations ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Loading...</p>
                                </div>
                            ) : conversations?.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send className="h-8 w-8 text-primary" />
                                    </div>
                                    <p className="font-medium mb-2">No conversations yet</p>
                                    <p className="text-sm text-muted-foreground mb-4">Start messaging parents</p>
                                    <button
                                        onClick={() => setShowNewConversationModal(true)}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                                    >
                                        New Conversation
                                    </button>
                                </div>
                            ) : (
                                conversations?.filter(conv => {
                                    if (!conversationSearch) return true;
                                    const otherUser = conv.staffUserId === currentUserId ? conv.parentUser : conv.staffUser;
                                    const searchLower = conversationSearch.toLowerCase();
                                    return (
                                        otherUser.firstName.toLowerCase().includes(searchLower) ||
                                        otherUser.lastName.toLowerCase().includes(searchLower) ||
                                        (conv.child?.firstName?.toLowerCase().includes(searchLower)) ||
                                        (conv.child?.lastName?.toLowerCase().includes(searchLower))
                                    );
                                }).map((conv) => {
                                    const otherUser = conv.staffUserId === currentUserId ? conv.parentUser : conv.staffUser;
                                    const lastMessage = conv.messages[0];
                                    const isUnread = lastMessage && !lastMessage.readAt && lastMessage.senderId !== currentUserId;
                                    const isSelected = selectedConversationId === conv.id;

                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => setSelectedConversationId(conv.id)}
                                            className={`w-full p-4 text-left border-b transition-all ${isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm ${isSelected ? 'bg-primary text-white' : 'bg-gradient-to-br from-primary/20 to-primary/40 text-primary'
                                                    }`}>
                                                    {otherUser.firstName[0]}{otherUser.lastName[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className={`font-medium truncate ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                                                            {otherUser.firstName} {otherUser.lastName}
                                                        </span>
                                                        {lastMessage && (
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                                {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {conv.child && (
                                                        <div className="text-xs text-primary font-medium mb-0.5">
                                                            {conv.child.firstName}
                                                        </div>
                                                    )}
                                                    {lastMessage && (
                                                        <p className={`text-sm truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                            {lastMessage.senderId === currentUserId && (
                                                                <span className="text-primary mr-1">You:</span>
                                                            )}
                                                            {lastMessage.content}
                                                        </p>
                                                    )}
                                                </div>
                                                {isUnread && (
                                                    <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </>
                    )}

                    {/* Announcements list */}
                    {activeTab === 'announcements' && (
                        <div className="p-4 space-y-3">
                            {loadingAnnouncements ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Loading...</p>
                                </div>
                            ) : announcements?.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Megaphone className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="font-medium mb-1">No announcements yet</p>
                                    <p className="text-sm text-muted-foreground mb-4">Create one to broadcast to all parents</p>
                                    <button
                                        onClick={() => setShowNewAnnouncementModal(true)}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                                    >
                                        Create Announcement
                                    </button>
                                </div>
                            ) : (
                                announcements?.map((announcement) => (
                                    <button
                                        key={announcement.id}
                                        onClick={() => {
                                            if (!announcement.isRead) {
                                                markAnnouncementReadMutation.mutate(announcement.id);
                                            }
                                            setSelectedAnnouncement(announcement);
                                        }}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${announcement.isRead
                                            ? 'bg-card border-border hover:border-primary/30'
                                            : 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${getPriorityColor(announcement.priority)}`}>
                                                {announcement.priority === 'URGENT' || announcement.priority === 'HIGH' ? (
                                                    <AlertTriangle className="h-4 w-4" />
                                                ) : (
                                                    <Bell className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-semibold ${!announcement.isRead ? 'text-foreground' : 'text-foreground/80'}`}>
                                                        {announcement.title}
                                                    </span>
                                                    {!announcement.isRead && (
                                                        <span className="px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">New</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                    {announcement.content}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>By {announcement.createdBy.firstName}</span>
                                                    <span>•</span>
                                                    <span>{formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
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
                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                            ) : messagesData?.messages?.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                                    <div>
                                        <div className="text-4xl mb-3">👋</div>
                                        <p className="font-medium">Start the conversation!</p>
                                        <p className="text-sm">Send a message to begin chatting</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groupedMessages && Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                                        <div key={dateKey}>
                                            {/* Date divider */}
                                            <div className="flex items-center gap-4 my-4">
                                                <div className="flex-1 h-px bg-border" />
                                                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                                                    {isToday(new Date(dateKey)) ? 'Today' :
                                                        isYesterday(new Date(dateKey)) ? 'Yesterday' :
                                                            format(new Date(dateKey), 'MMM d, yyyy')}
                                                </span>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>

                                            {/* Messages for this date */}
                                            <div className="space-y-3">
                                                {msgs.map((msg, idx) => {
                                                    const isMine = msg.senderId === currentUserId;
                                                    const showAvatar = idx === 0 || msgs[idx - 1].senderId !== msg.senderId;

                                                    return (
                                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            {!isMine && showAvatar && (
                                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium mr-2 flex-shrink-0">
                                                                    {msg.sender?.firstName?.[0] || '?'}
                                                                </div>
                                                            )}
                                                            {!isMine && !showAvatar && <div className="w-8 mr-2" />}
                                                            <div className={`max-w-[70%] group ${isMine ? 'order-1' : ''}`}>
                                                                <div className={`rounded-2xl px-4 py-2.5 ${isMine
                                                                    ? 'bg-primary text-white rounded-br-md'
                                                                    : 'bg-card border rounded-bl-md shadow-sm'
                                                                    }`}>
                                                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                                                                    {/* Attachments */}
                                                                    {msg.attachmentUrls?.length > 0 && (
                                                                        <div className="mt-2 space-y-2">
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
            {showNewConversationModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                        <div className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                            <div>
                                <h2 className="text-lg font-semibold">New Conversation</h2>
                                <p className="text-sm text-muted-foreground">Select a parent to message</p>
                            </div>
                            <button
                                onClick={() => setShowNewConversationModal(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search parents or children..."
                                    value={parentSearch}
                                    onChange={(e) => setParentSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[400px]">
                            {filteredParents?.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p>No parents found</p>
                                </div>
                            ) : (
                                filteredParents?.map((parent) => (
                                    <div key={parent.id} className="border-b last:border-0">
                                        <div className="p-4 bg-muted/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-semibold">
                                                    {parent.firstName[0]}{parent.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{parent.firstName} {parent.lastName}</div>
                                                    <div className="text-xs text-muted-foreground">{parent.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {parent.children.map((child) => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => handleStartConversation(parent.id, child.id)}
                                                    disabled={createConversationMutation.isPending}
                                                    className="w-full p-3 text-left hover:bg-muted rounded-xl transition-colors flex items-center justify-between group"
                                                >
                                                    <span className="text-sm">
                                                        About <strong>{child.firstName}</strong>
                                                    </span>
                                                    <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Message →
                                                    </span>
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handleStartConversation(parent.id)}
                                                disabled={createConversationMutation.isPending}
                                                className="w-full p-3 text-left hover:bg-muted rounded-xl transition-colors flex items-center justify-between text-muted-foreground group"
                                            >
                                                <span className="text-sm">General message</span>
                                                <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Message →
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* New Announcement Modal */}
            {showNewAnnouncementModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
                                    <Megaphone className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">New Announcement</h2>
                                    <p className="text-sm text-muted-foreground">Broadcast to all parents</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNewAnnouncementModal(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={announcementTitle}
                                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                                    placeholder="e.g., Important: Term Dates Update"
                                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Message</label>
                                <textarea
                                    value={announcementContent}
                                    onChange={(e) => setAnnouncementContent(e.target.value)}
                                    placeholder="Write your announcement message..."
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Priority</label>
                                <div className="flex gap-2">
                                    {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((priority) => (
                                        <button
                                            key={priority}
                                            type="button"
                                            onClick={() => setAnnouncementPriority(priority)}
                                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${announcementPriority === priority
                                                ? getPriorityColor(priority) + ' ring-2 ring-offset-2 ring-current'
                                                : 'bg-muted border-border hover:border-primary/50'
                                                }`}
                                        >
                                            {priority === 'URGENT' && '🚨 '}
                                            {priority === 'HIGH' && '⚠️ '}
                                            {priority}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t bg-muted/30 flex gap-3">
                            <button
                                onClick={() => setShowNewAnnouncementModal(false)}
                                className="flex-1 py-2.5 px-4 rounded-xl border hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAnnouncement}
                                disabled={!announcementTitle.trim() || !announcementContent.trim() || createAnnouncementMutation.isPending}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {createAnnouncementMutation.isPending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Megaphone className="h-4 w-4" />
                                        Broadcast
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcement Detail Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b flex items-start justify-between bg-gradient-to-r from-primary/5 to-transparent">
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
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
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
