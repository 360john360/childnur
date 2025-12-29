'use client';

import { useState } from 'react';
import { X, Megaphone } from 'lucide-react';
import { getPriorityColor } from '@/features/announcements/utils';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface CreateAnnouncementData {
    title: string;
    content: string;
    priority: Priority;
}

export interface NewAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAnnouncementData) => void;
    isSubmitting?: boolean;
}

export function NewAnnouncementModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting = false,
}: NewAnnouncementModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<Priority>('NORMAL');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) return;
        onSubmit({ title: title.trim(), content: content.trim(), priority });
        // Reset form after submit
        setTitle('');
        setContent('');
        setPriority('NORMAL');
    };

    const handleClose = () => {
        setTitle('');
        setContent('');
        setPriority('NORMAL');
        onClose();
    };

    return (
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
                        onClick={handleClose}
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
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Important: Term Dates Update"
                            className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Message</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your announcement message..."
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Priority</label>
                        <div className="flex gap-2">
                            {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${priority === p
                                            ? getPriorityColor(p) + ' ring-2 ring-offset-2 ring-current'
                                            : 'bg-muted border-border hover:border-primary/50'
                                        }`}
                                >
                                    {p === 'URGENT' && '🚨 '}
                                    {p === 'HIGH' && '⚠️ '}
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t bg-muted/30 flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 px-4 rounded-xl border hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || !content.trim() || isSubmitting}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
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
    );
}
