import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Child, ChildStatus, Prisma } from '@prisma/client';

@Injectable()
export class ChildrenService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string, options?: {
        roomId?: string;
        status?: ChildStatus;
        search?: string;
        includeGuardians?: boolean;
    }): Promise<Child[]> {
        const where: Prisma.ChildWhereInput = { tenantId };

        if (options?.roomId) where.roomId = options.roomId;
        if (options?.status) where.status = options.status;
        if (options?.search) {
            where.OR = [
                { firstName: { contains: options.search, mode: 'insensitive' } },
                { lastName: { contains: options.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.child.findMany({
            where,
            include: {
                room: true,
                keyPerson: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
                guardians: options?.includeGuardians ? {
                    include: { guardian: true },
                } : false,
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        });
    }

    async findOne(id: string, tenantId: string): Promise<Child> {
        const child = await this.prisma.child.findFirst({
            where: { id, tenantId },
            include: {
                room: true,
                keyPerson: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
                guardians: {
                    include: { guardian: true },
                },
                contacts: true,
            },
        });

        if (!child) {
            throw new NotFoundException(`Child with ID ${id} not found`);
        }

        return child;
    }

    async findByRoom(roomId: string, tenantId: string): Promise<Child[]> {
        return this.prisma.child.findMany({
            where: { roomId, tenantId, status: ChildStatus.ACTIVE },
            include: {
                keyPerson: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
            orderBy: { firstName: 'asc' },
        });
    }

    async getPresentToday(tenantId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.prisma.attendanceRecord.count({
            where: {
                date: today,
                status: 'CHECKED_IN',
                child: { tenantId },
            },
        });
    }

    async getWithAllergies(tenantId: string) {
        return this.prisma.child.findMany({
            where: {
                tenantId,
                hasAllergy: true,
                status: ChildStatus.ACTIVE,
            },
            include: {
                room: { select: { name: true } },
            },
        });
    }

    async getDashboardStats(tenantId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalChildren, presentToday, withAllergies, totalRooms] = await Promise.all([
            this.prisma.child.count({ where: { tenantId, status: ChildStatus.ACTIVE } }),
            this.prisma.attendanceRecord.count({
                where: {
                    date: today,
                    status: 'CHECKED_IN',
                    child: { tenantId },
                },
            }),
            this.prisma.child.count({ where: { tenantId, hasAllergy: true, status: ChildStatus.ACTIVE } }),
            this.prisma.room.count({ where: { tenantId, isActive: true } }),
        ]);

        return {
            totalChildren,
            presentToday,
            absentToday: totalChildren - presentToday,
            withAllergies,
            totalRooms,
        };
    }

    async getRooms(tenantId: string) {
        return this.prisma.room.findMany({
            where: { tenantId, isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                name: true,
                color: true,
                capacity: true,
                minAgeMonths: true,
                maxAgeMonths: true,
            },
        });
    }

    async getGuardians(tenantId: string) {
        return this.prisma.guardian.findMany({
            where: { tenantId, isBillPayer: true },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });
    }
}
