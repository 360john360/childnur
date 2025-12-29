'use client';

import { format, isToday, isYesterday } from 'date-fns';
import { MessageBubble, Message } from './MessageBubble';
import { Attachment } from '@/components/ui/lightbox';
import { RefObject } from 'react';

export interface MessageThreadProps {
    messages: Message[] | undefined;
    groupedMessages: Record<string, Message[]> | undefined;
    isLoading: boolean;
    currentUserId: string;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    onAttachmentClick: (attachment: Attachment) => void;
}

export function MessageThread({
    messages,
    groupedMessages,
    isLoading,
    currentUserId,
    messagesEndRef,
    onAttachmentClick,
}: MessageThreadProps) {
    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            </div>
        );
    }

    if (!messages || messages.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <div>
                        <div className="text-4xl mb-3">👋</div>
                        <p className="font-medium">Start the conversation!</p>
                        <p className="text-sm">Send a message to begin chatting</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4">
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
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        isMine={isMine}
                                        showAvatar={showAvatar}
                                        onAttachmentClick={onAttachmentClick}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div ref={messagesEndRef} />
        </div>
    );
}
