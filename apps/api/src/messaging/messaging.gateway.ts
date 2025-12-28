import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    tenantId?: string;
}

@WebSocketGateway({
    namespace: '/messaging',
    cors: {
        origin: '*', // Configure for production
        credentials: true,
    },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds

    constructor(
        private jwtService: JwtService,
        private messagingService: MessagingService,
    ) { }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            client.userId = payload.sub;
            client.tenantId = payload.tenantId;

            // Track socket for user
            const existingSockets = this.userSockets.get(client.userId!) || [];
            this.userSockets.set(client.userId!, [...existingSockets, client.id]);

            // Join user-specific room for targeted messages
            client.join(`user:${client.userId}`);

            console.log(`[MessagingGateway] User ${client.userId} connected (socket: ${client.id})`);
        } catch (error) {
            console.error('[MessagingGateway] Authentication failed:', error);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (client.userId) {
            const sockets = this.userSockets.get(client.userId) || [];
            this.userSockets.set(
                client.userId,
                sockets.filter(id => id !== client.id)
            );
            console.log(`[MessagingGateway] User ${client.userId} disconnected`);
        }
    }

    /**
     * Handle sending a message
     */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { conversationId: string; content: string; attachmentUrls?: string[] },
    ) {
        if (!client.userId) {
            return { error: 'Not authenticated' };
        }

        try {
            const message = await this.messagingService.sendMessage({
                conversationId: data.conversationId,
                senderId: client.userId,
                content: data.content,
                attachmentUrls: data.attachmentUrls,
            });

            // Prepare message payload (without internal conversation data)
            const messagePayload = {
                ...message,
                conversation: undefined,
            };

            // Get recipient ID
            const recipientId = message.conversation.staffUserId === client.userId
                ? message.conversation.parentUserId
                : message.conversation.staffUserId;

            // Emit to SENDER immediately so their UI updates
            client.emit('message_received', messagePayload);

            // Check if recipient is in quiet hours
            const inQuietHours = await this.messagingService.isInQuietHours(recipientId);

            // Emit to recipient if not in quiet hours (using their user room)
            if (!inQuietHours) {
                this.server.to(`user:${recipientId}`).emit('message_received', messagePayload);
            }

            // Also emit to conversation room for anyone else listening (managers)
            this.server.to(`conversation:${data.conversationId}`).emit('message_received', messagePayload);

            // Confirm to sender
            return { success: true, message: messagePayload };
        } catch (error) {
            console.error('[MessagingGateway] Error sending message:', error);
            return { error: 'Failed to send message' };
        }
    }

    /**
     * Handle typing indicator
     */
    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { conversationId: string; isTyping: boolean },
    ) {
        if (!client.userId) return;

        // Get conversation to find recipient
        const conversation = await this.messagingService.getMessages(data.conversationId, 1, 0);
        if (!conversation) return;

        // Broadcast typing to conversation participants (except sender)
        this.server.to(`conversation:${data.conversationId}`).emit('user_typing', {
            conversationId: data.conversationId,
            userId: client.userId,
            isTyping: data.isTyping,
        });
    }

    /**
     * Handle read receipt
     */
    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { conversationId: string },
    ) {
        if (!client.userId) return;

        const result = await this.messagingService.markMessagesAsRead(data.conversationId, client.userId);

        if (!result) return { success: false };

        const readPayload = {
            conversationId: data.conversationId,
            readBy: client.userId,
            readAt: new Date(),
        };

        // Get the other participant to notify them directly
        const otherUserId = result.staffUserId === client.userId
            ? result.parentUserId
            : result.staffUserId;

        // Emit to the OTHER user's room so they see their messages as "read"
        this.server.to(`user:${otherUserId}`).emit('messages_read', readPayload);

        // Also emit to conversation room for anyone else listening
        this.server.to(`conversation:${data.conversationId}`).emit('messages_read', readPayload);

        return { success: true };
    }

    /**
     * Join a conversation room for real-time updates
     */
    @SubscribeMessage('join_conversation')
    async handleJoinConversation(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { conversationId: string },
    ) {
        client.join(`conversation:${data.conversationId}`);
        return { success: true };
    }

    /**
     * Leave a conversation room
     */
    @SubscribeMessage('leave_conversation')
    async handleLeaveConversation(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { conversationId: string },
    ) {
        client.leave(`conversation:${data.conversationId}`);
        return { success: true };
    }
}
