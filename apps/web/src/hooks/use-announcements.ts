'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    targetRoomIds: string[];
    expiresAt: string | null;
    publishedAt: string;
    createdAt: string;
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
    isRead: boolean;
    readAt: string | null;
}

/**
 * Fetch all announcements
 */
export function useAnnouncements(options?: { limit?: number; includeExpired?: boolean }) {
    const { limit = 20, includeExpired = false } = options || {};

    return useQuery<Announcement[]>({
        queryKey: ['announcements', { limit, includeExpired }],
        queryFn: () => fetchWithAuth(`/announcements?limit=${limit}&includeExpired=${includeExpired}`),
        staleTime: 60000, // 1 minute
    });
}

/**
 * Get unread announcement count
 */
export function useAnnouncementUnreadCount() {
    return useQuery<{ count: number }>({
        queryKey: ['announcements-unread'],
        queryFn: () => fetchWithAuth('/announcements/unread-count'),
        staleTime: 30000,
    });
}

/**
 * Create a new announcement
 */
export function useCreateAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            content: string;
            priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
            targetRoomIds?: string[];
            expiresAt?: string;
        }) => fetchWithAuth('/announcements', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        },
    });
}

/**
 * Mark an announcement as read
 */
export function useMarkAnnouncementRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (announcementId: string) => fetchWithAuth(`/announcements/${announcementId}/read`, {
            method: 'PATCH',
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            queryClient.invalidateQueries({ queryKey: ['announcements-unread'] });
        },
    });
}

/**
 * Delete an announcement
 */
export function useDeleteAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (announcementId: string) => fetchWithAuth(`/announcements/${announcementId}`, {
            method: 'DELETE',
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        },
    });
}
