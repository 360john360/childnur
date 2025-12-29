'use client';

import { formatDistanceToNow } from 'date-fns';
import { Megaphone, AlertTriangle, Bell } from 'lucide-react';
import { getPriorityColor } from '@/features/announcements/utils';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    publishedAt: string;
    isRead: boolean;
    createdBy: {
        firstName: string;
        lastName: string;
    };
}

export interface AnnouncementsListProps {
    announcements: Announcement[] | undefined;
    isLoading: boolean;
    onAnnouncementClick: (announcement: Announcement) => void;
    onCreateClick: () => void;
}

export function AnnouncementsList({
    announcements,
    isLoading,
    onAnnouncementClick,
    onCreateClick,
}: AnnouncementsListProps) {
    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!announcements || announcements.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">No announcements yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create one to broadcast to all parents</p>
                <button
                    onClick={onCreateClick}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                >
                    Create Announcement
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            {announcements.map((announcement) => (
                <button
                    key={announcement.id}
                    onClick={() => onAnnouncementClick(announcement)}
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
            ))}
        </div>
    );
}
