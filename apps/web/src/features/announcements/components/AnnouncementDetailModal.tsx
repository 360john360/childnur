'use client';

import { format } from 'date-fns';
import { X, AlertTriangle, Bell } from 'lucide-react';
import { getPriorityColor } from '@/features/announcements/utils';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    publishedAt: string;
    createdBy: {
        firstName: string;
        lastName: string;
    };
}

export interface AnnouncementDetailModalProps {
    announcement: Announcement | null;
    onClose: () => void;
}

export function AnnouncementDetailModal({
    announcement,
    onClose,
}: AnnouncementDetailModalProps) {
    if (!announcement) return null;

    const isHighPriority = announcement.priority === 'URGENT' || announcement.priority === 'HIGH';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-5 border-b flex items-start justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${getPriorityColor(announcement.priority)}`}>
                            {isHighPriority ? (
                                <AlertTriangle className="h-5 w-5" />
                            ) : (
                                <Bell className="h-5 w-5" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{announcement.title}</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>From {announcement.createdBy.firstName} {announcement.createdBy.lastName}</span>
                                <span>•</span>
                                <span>{format(new Date(announcement.publishedAt), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {announcement.content}
                    </div>
                </div>

                <div className="p-4 border-t bg-muted/30">
                    <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority} Priority
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
