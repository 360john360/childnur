const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Helper for authenticated API requests
 */
async function fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    publishedAt: string;
    expiresAt?: string;
    isRead: boolean;
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface CreateAnnouncementDto {
    title: string;
    content: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    expiresAt?: string;
    targetRoomIds?: string[];
}

/**
 * Announcements REST API client
 */
export const announcementsApi = {
    /**
     * Get all announcements with read status
     */
    getAnnouncements: () =>
        fetchWithAuth<Announcement[]>('/announcements'),

    /**
     * Get unread announcement count
     */
    getUnreadCount: () =>
        fetchWithAuth<{ count: number }>('/announcements/unread-count'),

    /**
     * Create a new announcement (managers only)
     */
    createAnnouncement: (data: CreateAnnouncementDto) =>
        fetchWithAuth<Announcement>('/announcements', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Mark an announcement as read
     */
    markAsRead: (announcementId: string) =>
        fetchWithAuth<void>(`/announcements/${announcementId}/read`, {
            method: 'PATCH',
        }),

    /**
     * Delete an announcement (creator only)
     */
    deleteAnnouncement: (announcementId: string) =>
        fetchWithAuth<void>(`/announcements/${announcementId}`, {
            method: 'DELETE',
        }),
};
