import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DailyLog, DailyLogType, LogStatus, Prisma } from '@prisma/client';

@Injectable()
export class DailyLogsService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string, options?: {
        childId?: string;
        type?: DailyLogType;
        date?: Date;
        status?: LogStatus;
        limit?: number;
    }): Promise<DailyLog[]> {
        const where: Prisma.DailyLogWhereInput = { tenantId };

        if (options?.childId) where.childId = options.childId;
        if (options?.type) where.type = options.type;
        if (options?.status) where.status = options.status;

        if (options?.date) {
            const startOfDay = new Date(options.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(options.date);
            endOfDay.setHours(23, 59, 59, 999);

            where.timestamp = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        return this.prisma.dailyLog.findMany({
            where,
            include: {
                child: {
                    select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
                },
                author: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { timestamp: 'desc' },
            take: options?.limit || 50,
        });
    }

    async findByChild(childId: string, tenantId: string, options?: {
        limit?: number;
        type?: DailyLogType;
    }): Promise<DailyLog[]> {
        return this.prisma.dailyLog.findMany({
            where: {
                childId,
                tenantId,
                ...(options?.type && { type: options.type }),
            },
            include: {
                author: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { timestamp: 'desc' },
            take: options?.limit || 20,
        });
    }

    async create(data: {
        tenantId: string;
        childId: string;
        authorId: string;
        type: DailyLogType;
        data: any;
        notes?: string;
        timestamp?: Date;
    }): Promise<DailyLog> {
        return this.prisma.dailyLog.create({
            data: {
                tenantId: data.tenantId,
                childId: data.childId,
                authorId: data.authorId,
                type: data.type,
                data: data.data,
                notes: data.notes,
                timestamp: data.timestamp || new Date(),
                status: LogStatus.PUBLISHED,
                publishedAt: new Date(),
                mediaUrls: [],
            },
            include: {
                child: {
                    select: { firstName: true, lastName: true },
                },
                author: {
                    select: { firstName: true, lastName: true },
                },
            },
        });
    }

    async getRecentActivity(tenantId: string, limit = 10): Promise<DailyLog[]> {
        return this.prisma.dailyLog.findMany({
            where: {
                tenantId,
                status: LogStatus.PUBLISHED,
            },
            include: {
                child: {
                    select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true, hasAllergy: true, allergies: true },
                },
                author: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    async getTodayStats(tenantId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [total, byType] = await Promise.all([
            this.prisma.dailyLog.count({
                where: {
                    tenantId,
                    timestamp: { gte: today, lt: tomorrow },
                },
            }),
            this.prisma.dailyLog.groupBy({
                by: ['type'],
                where: {
                    tenantId,
                    timestamp: { gte: today, lt: tomorrow },
                },
                _count: true,
            }),
        ]);

        return {
            total,
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count;
                return acc;
            }, {} as Record<string, number>),
        };
    }
}
