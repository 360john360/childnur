'use client';

import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { AttachmentPreview, Attachment } from '@/components/ui/lightbox';

export interface Message {
    id: string;
    content: string;
    createdAt: string;
    readAt?: string | null;
    senderId: string;
    attachmentUrls?: string[];
    sender?: {
        firstName?: string;
        lastName?: string;
    };
}

export interface MessageBubbleProps {
    message: Message;
    isMine: boolean;
    showAvatar: boolean;
    onAttachmentClick: (attachment: Attachment) => void;
}

export function MessageBubble({
    message,
    isMine,
    showAvatar,
    onAttachmentClick,
}: MessageBubbleProps) {
    return (
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            {!isMine && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium mr-2 flex-shrink-0">
                    {message.sender?.firstName?.[0] || '?'}
                </div>
            )}
            {!isMine && !showAvatar && <div className="w-8 mr-2" />}
            <div className={`max-w-[70%] group ${isMine ? 'order-1' : ''}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${isMine
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-card border rounded-bl-md shadow-sm'
                    }`}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>

                    {/* Attachments */}
                    {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {message.attachmentUrls.map((url, i) => (
                                <AttachmentPreview
                                    key={i}
                                    attachment={url}
                                    isMine={isMine}
                                    onClickPreview={onAttachmentClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className={`flex items-center gap-1 mt-1 text-xs ${isMine ? 'justify-end text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                    <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
                    {isMine && (
                        message.readAt ? (
                            <CheckCheck className="h-3.5 w-3.5 text-primary" />
                        ) : (
                            <Check className="h-3.5 w-3.5" />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
