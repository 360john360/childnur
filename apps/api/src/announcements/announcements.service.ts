import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all announcements for a tenant (with read status for user)
     */
    async getAnnouncements(tenantId: string, userId: string, options?: { limit?: number; includeExpired?: boolean }) {
        const { limit = 20, includeExpired = false } = options || {};

        const where: any = {
            tenantId,
            publishedAt: { lte: new Date() },
        };

        if (!includeExpired) {
            where.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
            ];
        }

        const announcements = await this.prisma.announcement.findMany({
            where,
            orderBy: [
                { priority: 'desc' },
                { publishedAt: 'desc' },
            ],
            take: limit,
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                reads: {
                    where: { userId },
                    select: { readAt: true },
                },
            },
        });

        return announcements.map((a: any) => ({
            ...a,
            isRead: a.reads.length > 0,
            readAt: a.reads[0]?.readAt || null,
            reads: undefined, // Remove raw reads array
        }));
    }

    /**
     * Get unread announcement count for a user
     */
    async getUnreadCount(tenantId: string, userId: string): Promise<number> {
        const count = await this.prisma.announcement.count({
            where: {
                tenantId,
                publishedAt: { lte: new Date() },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
                reads: {
                    none: { userId },
                },
            },
        });

        return count;
    }

    /**
     * Create a new announcement (staff only)
     */
    async createAnnouncement(
        tenantId: string,
        createdById: string,
        data: {
            title: string;
            content: string;
            priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
            targetRoomIds?: string[];
            expiresAt?: Date;
        }
    ) {
        // Verify user has permission (manager or above)
        const user = await this.prisma.user.findUnique({
            where: { id: createdById },
            select: { role: true },
        });

        const allowedRoles: UserRole[] = ['OWNER', 'MANAGER', 'DEPUTY'];
        if (!user || !allowedRoles.includes(user.role)) {
            throw new ForbiddenException('Only managers can create announcements');
        }

        return this.prisma.announcement.create({
            data: {
                tenantId,
                createdById,
                title: data.title,
                content: data.content,
                priority: data.priority || 'NORMAL',
                targetRoomIds: data.targetRoomIds || [],
                expiresAt: data.expiresAt,
            },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }

    /**
     * Mark an announcement as read
     */
    async markAsRead(announcementId: string, userId: string) {
        // Check if already read
        const existing = await this.prisma.announcementRead.findUnique({
            where: {
                announcementId_userId: { announcementId, userId },
            },
        });

        if (existing) {
            return existing;
        }

        return this.prisma.announcementRead.create({
            data: {
                announcementId,
                userId,
            },
        });
    }

    /**
     * Delete an announcement
     */
    async deleteAnnouncement(announcementId: string, userId: string) {
        const announcement = await this.prisma.announcement.findUnique({
            where: { id: announcementId },
            select: { createdById: true },
        });

        if (!announcement) {
            throw new NotFoundException('Announcement not found');
        }

        // Only creator can delete
        if (announcement.createdById !== userId) {
            throw new ForbiddenException('Only the creator can delete this announcement');
        }

        await this.prisma.announcement.delete({
            where: { id: announcementId },
        });

        return { success: true };
    }
}
