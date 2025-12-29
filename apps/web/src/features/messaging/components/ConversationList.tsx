'use client';

import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

export interface Conversation {
    id: string;
    staffUserId: string;
    parentUser: { firstName: string; lastName: string };
    staffUser: { firstName: string; lastName: string };
    child?: { firstName: string; lastName: string };
    messages: Array<{
        id: string;
        content: string;
        createdAt: string;
        readAt?: string | null;
        senderId: string;
    }>;
}

export interface ConversationListProps {
    conversations: Conversation[] | undefined;
    isLoading: boolean;
    currentUserId: string;
    selectedConversationId: string | null;
    searchQuery: string;
    onConversationClick: (conversationId: string) => void;
    onNewConversationClick: () => void;
}

export function ConversationList({
    conversations,
    isLoading,
    currentUserId,
    selectedConversationId,
    searchQuery,
    onConversationClick,
    onNewConversationClick,
}: ConversationListProps) {
    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!conversations || conversations.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium mb-2">No conversations yet</p>
                <p className="text-sm text-muted-foreground mb-4">Start messaging parents</p>
                <button
                    onClick={onNewConversationClick}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                >
                    New Conversation
                </button>
            </div>
        );
    }

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const otherUser = conv.staffUserId === currentUserId ? conv.parentUser : conv.staffUser;
        const searchLower = searchQuery.toLowerCase();
        return (
            otherUser.firstName.toLowerCase().includes(searchLower) ||
            otherUser.lastName.toLowerCase().includes(searchLower) ||
            conv.child?.firstName?.toLowerCase().includes(searchLower) ||
            conv.child?.lastName?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <>
            {filteredConversations.map((conv) => {
                const otherUser = conv.staffUserId === currentUserId ? conv.parentUser : conv.staffUser;
                const lastMessage = conv.messages[0];
                const isUnread = lastMessage && !lastMessage.readAt && lastMessage.senderId !== currentUserId;
                const isSelected = selectedConversationId === conv.id;

                return (
                    <button
                        key={conv.id}
                        onClick={() => onConversationClick(conv.id)}
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
            })}
        </>
    );
}
