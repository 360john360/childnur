import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SocketCallbacks {
    onMessageReceived?: (message: any) => void;
    onMessagesRead?: (data: { conversationId: string; userId: string }) => void;
    onTyping?: (data: { conversationId: string; userId: string }) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: any) => void;
}

/**
 * Create and manage a messaging WebSocket connection
 */
export function createMessagingSocket(callbacks: SocketCallbacks = {}): {
    socket: Socket;
    connect: () => void;
    disconnect: () => void;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    sendMessage: (conversationId: string, content: string, attachmentUrls?: string[]) => void;
    markAsRead: (conversationId: string) => void;
    sendTyping: (conversationId: string) => void;
} {
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    const socket = io(API_BASE, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: false,
    });

    // Set up event listeners
    socket.on('connect', () => {
        callbacks.onConnect?.();
    });

    socket.on('disconnect', () => {
        callbacks.onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
        callbacks.onError?.(error);
    });

    socket.on('message_received', (message) => {
        callbacks.onMessageReceived?.(message);
    });

    socket.on('messages_read', (data) => {
        callbacks.onMessagesRead?.(data);
    });

    socket.on('user_typing', (data) => {
        callbacks.onTyping?.(data);
    });

    return {
        socket,
        connect: () => socket.connect(),
        disconnect: () => socket.disconnect(),
        joinConversation: (conversationId: string) => {
            socket.emit('join_conversation', { conversationId });
        },
        leaveConversation: (conversationId: string) => {
            socket.emit('leave_conversation', { conversationId });
        },
        sendMessage: (conversationId: string, content: string, attachmentUrls?: string[]) => {
            socket.emit('send_message', { conversationId, content, attachmentUrls });
        },
        markAsRead: (conversationId: string) => {
            socket.emit('mark_read', { conversationId });
        },
        sendTyping: (conversationId: string) => {
            socket.emit('typing', { conversationId });
        },
    };
}
