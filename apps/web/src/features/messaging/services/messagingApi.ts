import { getCurrentUserId } from '@/lib/auth';

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

/**
 * Messaging REST API client
 */
export const messagingApi = {
    /**
     * Get all conversations for current user
     */
    getConversations: () =>
        fetchWithAuth<any[]>('/messaging/conversations'),

    /**
     * Get messages for a specific conversation
     */
    getMessages: (conversationId: string) =>
        fetchWithAuth<{ messages: any[]; conversation: any }>(
            `/messaging/conversations/${conversationId}/messages`
        ),

    /**
     * Send a message
     */
    sendMessage: (conversationId: string, data: { content: string; attachmentUrls?: string[] }) =>
        fetchWithAuth<any>(`/messaging/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Create a new conversation
     */
    createConversation: (data: { parentUserId: string; childId: string }) =>
        fetchWithAuth<any>('/messaging/conversations', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Mark messages as read
     */
    markAsRead: (conversationId: string) =>
        fetchWithAuth<any>(`/messaging/conversations/${conversationId}/read`, {
            method: 'PATCH',
        }),

    /**
     * Get unread message count
     */
    getUnreadCount: () =>
        fetchWithAuth<{ unreadCount: number }>('/messaging/unread-count'),

    /**
     * Get list of parents for new conversation
     */
    getParentsList: () =>
        fetchWithAuth<any[]>('/messaging/parents'),

    /**
     * Get key person for a child
     */
    getKeyPerson: (childId: string) =>
        fetchWithAuth<any>(`/messaging/key-person/${childId}`),
};
