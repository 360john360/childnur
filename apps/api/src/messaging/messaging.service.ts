import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateConversationDto {
    tenantId: string;
    staffUserId: string;
    parentUserId: string;
    childId?: string;
}

interface SendMessageDto {
    conversationId: string;
    senderId: string;
    content: string;
    attachmentUrls?: string[];
}

@Injectable()
export class MessagingService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all conversations for a user (staff or parent)
     * Managers can see ALL conversations in their tenant (for coverage)
     */
    async getConversations(tenantId: string, userId: string, userRole?: string) {
        // Managers can see all conversations for coverage when staff is absent
        const isManager = userRole === 'MANAGER' || userRole === 'OWNER' || userRole === 'ADMIN';

        return this.prisma.conversation.findMany({
            where: isManager ? { tenantId } : {
                tenantId,
                OR: [
                    { staffUserId: userId },
                    { parentUserId: userId },
                ],
            },
            include: {
                staffUser: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                parentUser: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                child: {
                    select: { id: true, firstName: true, lastName: true },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        content: true,
                        senderId: true,
                        createdAt: true,
                        readAt: true,
                    },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });
    }

    /**
     * Get or create a conversation between staff and parent
     */
    async getOrCreateConversation(data: CreateConversationDto) {
        const existing = await this.prisma.conversation.findFirst({
            where: {
                tenantId: data.tenantId,
                staffUserId: data.staffUserId,
                parentUserId: data.parentUserId,
                childId: data.childId || null,
            },
        });

        if (existing) {
            return existing;
        }

        return this.prisma.conversation.create({
            data: {
                tenantId: data.tenantId,
                staffUserId: data.staffUserId,
                parentUserId: data.parentUserId,
                childId: data.childId,
            },
        });
    }

    /**
     * Get messages in a conversation with pagination
     */
    async getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { conversationId },
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.message.count({ where: { conversationId } }),
        ]);

        return { messages: messages.reverse(), total };
    }

    /**
     * Send a message in a conversation
     */
    async sendMessage(data: SendMessageDto) {
        const message = await this.prisma.message.create({
            data: {
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                attachmentUrls: data.attachmentUrls || [],
            },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                conversation: {
                    select: { staffUserId: true, parentUserId: true },
                },
            },
        });

        // Update conversation lastMessageAt
        await this.prisma.conversation.update({
            where: { id: data.conversationId },
            data: { lastMessageAt: new Date() },
        });

        return message;
    }

    /**
     * Mark messages as read and return conversation info for routing
     */
    async markMessagesAsRead(conversationId: string, userId: string) {
        // Update messages
        await this.prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                readAt: null,
            },
            data: { readAt: new Date() },
        });

        // Return conversation info for routing the read receipt
        return this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { staffUserId: true, parentUserId: true },
        });
    }

    /**
     * Get unread message count for a user
     */
    async getUnreadCount(tenantId: string, userId: string) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                tenantId,
                OR: [
                    { staffUserId: userId },
                    { parentUserId: userId },
                ],
            },
            select: { id: true },
        });

        const count = await this.prisma.message.count({
            where: {
                conversationId: { in: conversations.map(c => c.id) },
                senderId: { not: userId },
                readAt: null,
            },
        });

        return { unreadCount: count };
    }

    /**
     * Check if user is in quiet hours
     */
    async isInQuietHours(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { quietHoursStart: true, quietHoursEnd: true },
        });

        if (!user?.quietHoursStart || !user?.quietHoursEnd) {
            return false;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const start = user.quietHoursStart;
        const end = user.quietHoursEnd;

        // Handle overnight quiet hours (e.g., 22:00 to 07:00)
        if (start > end) {
            return currentTime >= start || currentTime < end;
        }

        return currentTime >= start && currentTime < end;
    }

    /**
     * Get list of parents for staff to start conversations
     */
    async getParentsForConversation(tenantId: string) {
        // Get all guardians (parents) with their linked children
        // Only get guardians that have a linked user account (can receive messages)
        const guardians = await this.prisma.guardian.findMany({
            where: {
                tenantId,
                userId: { not: null }, // Must have a user account to message
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                children: {
                    include: {
                        child: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });

        return guardians
            .filter((g): g is typeof g & { user: NonNullable<typeof g.user> } => g.user !== null)
            .map(g => ({
                id: g.user.id,
                firstName: g.user.firstName,
                lastName: g.user.lastName,
                email: g.user.email,
                avatarUrl: g.user.avatarUrl,
                children: g.children.map(cg => cg.child),
            }));
    }

    /**
     * Get key person for a child (for parent to start conversation)
     */
    async getKeyPersonForChild(childId: string) {
        const child = await this.prisma.child.findUnique({
            where: { id: childId },
            include: {
                keyPerson: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        if (!child?.keyPerson?.user) {
            return null;
        }

        return child.keyPerson.user;
    }
}
