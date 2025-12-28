import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
}

interface Child {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
}

interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentUrls: string[];
    readAt: string | null;
    createdAt: string;
    sender: User;
}

interface Conversation {
    id: string;
    tenantId: string;
    staffUserId: string;
    parentUserId: string;
    childId?: string;
    lastMessageAt: string;
    staffUser: User;
    parentUser: User;
    child?: Child;
    messages: Message[];
}

// Fetch helpers
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

// Socket.IO connection management
let socket: Socket | null = null;

export function useMessagingSocket() {
    const [connected, setConnected] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.log('[Messaging] No access token found');
            return;
        }

        console.log('[Messaging] Connecting to', `${WS_URL}/messaging`);

        socket = io(`${WS_URL}/messaging`, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('[Messaging] Connected to WebSocket');
            setConnected(true);
        });

        socket.on('connect_error', (error) => {
            console.error('[Messaging] Connection error:', error.message);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Messaging] Disconnected:', reason);
            setConnected(false);
        });

        socket.on('message_received', (message: Message) => {
            console.log('[Messaging] Message received:', message);

            // Optimistically update the messages cache for instant UI update
            queryClient.setQueryData<{ messages: Message[]; total: number }>(
                ['messages', message.conversationId],
                (old) => {
                    if (!old) return { messages: [message], total: 1 };
                    // Avoid duplicates
                    const exists = old.messages.some(m => m.id === message.id);
                    if (exists) return old;
                    return {
                        messages: [...old.messages, message],
                        total: old.total + 1,
                    };
                }
            );

            // Also refresh conversations list to update last message
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        });

        socket.on('messages_read', (data: { conversationId: string; readBy: string }) => {
            queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
        });

        return () => {
            socket?.disconnect();
            socket = null;
        };
    }, [queryClient]);

    const sendMessage = useCallback((conversationId: string, content: string, attachmentUrls?: string[]) => {
        if (!socket?.connected) return;
        socket.emit('send_message', { conversationId, content, attachmentUrls });
    }, []);

    const markAsRead = useCallback((conversationId: string) => {
        if (!socket?.connected) return;
        socket.emit('mark_read', { conversationId });
    }, []);

    const joinConversation = useCallback((conversationId: string) => {
        if (!socket?.connected) return;
        socket.emit('join_conversation', { conversationId });
    }, []);

    const leaveConversation = useCallback((conversationId: string) => {
        if (!socket?.connected) return;
        socket.emit('leave_conversation', { conversationId });
    }, []);

    return { connected, sendMessage, markAsRead, joinConversation, leaveConversation };
}

// Query hooks
export function useConversations() {
    return useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: () => fetchWithAuth('/messaging/conversations'),
    });
}

export function useMessages(conversationId: string | null, enabled = true) {
    return useQuery<{ messages: Message[]; total: number }>({
        queryKey: ['messages', conversationId],
        queryFn: () => fetchWithAuth(`/messaging/conversations/${conversationId}/messages`),
        enabled: !!conversationId && enabled,
    });
}

export function useUnreadCount() {
    return useQuery<{ unreadCount: number }>({
        queryKey: ['unread-count'],
        queryFn: () => fetchWithAuth('/messaging/unread-count'),
        refetchInterval: 30000, // Refresh every 30s
    });
}

// Mutation hooks
export function useCreateConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { parentUserId?: string; staffUserId?: string; childId?: string }) =>
            fetchWithAuth('/messaging/conversations', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
}

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { conversationId: string; content: string; attachmentUrls?: string[] }) =>
            fetchWithAuth(`/messaging/conversations/${data.conversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content: data.content, attachmentUrls: data.attachmentUrls }),
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (conversationId: string) =>
            fetchWithAuth(`/messaging/conversations/${conversationId}/read`, {
                method: 'PATCH',
            }),
        onSuccess: (_, conversationId) => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        },
    });
}

// Hook to get list of parents for starting new conversations (staff use)
export function useParentsList() {
    return useQuery<Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string;
        children: Array<{ id: string; firstName: string; lastName: string }>;
    }>>({
        queryKey: ['parents-list'],
        queryFn: () => fetchWithAuth('/messaging/parents'),
    });
}

// Hook to get key person for a child (parent use)
export function useKeyPerson(childId: string | null) {
    return useQuery<{
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    } | null>({
        queryKey: ['key-person', childId],
        queryFn: () => fetchWithAuth(`/messaging/key-person/${childId}`),
        enabled: !!childId,
    });
}
