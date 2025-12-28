import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get today's attendance for all children, optionally filtered by room
     */
    async getTodaysAttendance(tenantId: string, roomId?: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all active children for this tenant
        const children = await this.prisma.child.findMany({
            where: {
                tenantId,
                status: 'ACTIVE',
                ...(roomId ? { roomId } : {}),
            },
            include: {
                room: true,
                keyPerson: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
                attendanceRecords: {
                    where: {
                        date: today,
                    },
                },
            },
            orderBy: [
                { room: { name: 'asc' } },
                { firstName: 'asc' },
            ],
        });

        // Map children with their attendance status
        return children.map((child) => {
            const todayRecord = child.attendanceRecords[0];
            return {
                id: child.id,
                firstName: child.firstName,
                lastName: child.lastName,
                profilePhotoUrl: child.profilePhotoUrl,
                hasAllergy: child.hasAllergy,
                room: child.room,
                keyPerson: child.keyPerson,
                expectedDays: child.expectedDays,
                attendance: todayRecord
                    ? {
                        id: todayRecord.id,
                        status: todayRecord.status,
                        checkInTime: todayRecord.checkInTime,
                        checkOutTime: todayRecord.checkOutTime,
                        collectedBy: todayRecord.collectedBy,
                        collectorRelationship: todayRecord.collectorRelationship,
                        absenceReason: todayRecord.absenceReason,
                    }
                    : null,
            };
        });
    }

    /**
     * Get attendance statistics for today
     */
    async getAttendanceStats(tenantId: string, roomId?: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalChildren = await this.prisma.child.count({
            where: {
                tenantId,
                status: 'ACTIVE',
                ...(roomId ? { roomId } : {}),
            },
        });

        const checkedIn = await this.prisma.attendanceRecord.count({
            where: {
                child: {
                    tenantId,
                    status: 'ACTIVE',
                    ...(roomId ? { roomId } : {}),
                },
                date: today,
                status: 'CHECKED_IN',
            },
        });

        const checkedOut = await this.prisma.attendanceRecord.count({
            where: {
                child: {
                    tenantId,
                    status: 'ACTIVE',
                    ...(roomId ? { roomId } : {}),
                },
                date: today,
                status: 'CHECKED_OUT',
            },
        });

        const absent = await this.prisma.attendanceRecord.count({
            where: {
                child: {
                    tenantId,
                    status: 'ACTIVE',
                    ...(roomId ? { roomId } : {}),
                },
                date: today,
                status: { in: ['ABSENT_NOTIFIED', 'ABSENT_UNNOTIFIED'] },
            },
        });

        return {
            total: totalChildren,
            present: checkedIn,
            departed: checkedOut,
            absent,
            expected: totalChildren - checkedIn - checkedOut - absent,
        };
    }

    /**
     * Check in a child with exact timestamp
     */
    async checkIn(childId: string, staffId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        // Upsert attendance record for today
        return this.prisma.attendanceRecord.upsert({
            where: {
                childId_date: {
                    childId,
                    date: today,
                },
            },
            update: {
                status: 'CHECKED_IN',
                checkInTime: now,
                checkedInBy: staffId,
            },
            create: {
                childId,
                date: today,
                status: 'CHECKED_IN',
                checkInTime: now,
                checkedInBy: staffId,
            },
        });
    }

    /**
     * Check out a child with collector information
     */
    async checkOut(
        childId: string,
        staffId: string,
        collectedBy?: string,
        collectorRelationship?: string,
    ) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        const record = await this.prisma.attendanceRecord.findUnique({
            where: {
                childId_date: {
                    childId,
                    date: today,
                },
            },
        });

        if (!record) {
            throw new NotFoundException('No check-in record found for today');
        }

        return this.prisma.attendanceRecord.update({
            where: { id: record.id },
            data: {
                status: 'CHECKED_OUT',
                checkOutTime: now,
                checkedOutBy: staffId,
                collectedBy,
                collectorRelationship,
            },
        });
    }

    /**
     * Bulk check-in multiple children
     */
    async bulkCheckIn(childIds: string[], staffId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        const results = await Promise.all(
            childIds.map((childId) =>
                this.prisma.attendanceRecord.upsert({
                    where: {
                        childId_date: {
                            childId,
                            date: today,
                        },
                    },
                    update: {
                        status: 'CHECKED_IN',
                        checkInTime: now,
                        checkedInBy: staffId,
                    },
                    create: {
                        childId,
                        date: today,
                        status: 'CHECKED_IN',
                        checkInTime: now,
                        checkedInBy: staffId,
                    },
                }),
            ),
        );

        return { count: results.length, records: results };
    }

    /**
     * Mark a child as absent
     */
    async markAbsent(childId: string, reason?: string, notified: boolean = true) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const status: AttendanceStatus = notified
            ? 'ABSENT_NOTIFIED'
            : 'ABSENT_UNNOTIFIED';

        return this.prisma.attendanceRecord.upsert({
            where: {
                childId_date: {
                    childId,
                    date: today,
                },
            },
            update: {
                status,
                absenceReason: reason,
            },
            create: {
                childId,
                date: today,
                status,
                absenceReason: reason,
            },
        });
    }

    /**
     * Get attendance history for a child
     */
    async getAttendanceHistory(
        childId: string,
        startDate: Date,
        endDate: Date,
    ) {
        return this.prisma.attendanceRecord.findMany({
            where: {
                childId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Undo check-in - reset child to Expected status
     * Deletes the attendance record for today
     */
    async undoCheckIn(childId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await this.prisma.attendanceRecord.findUnique({
            where: {
                childId_date: {
                    childId,
                    date: today,
                },
            },
        });

        if (!record) {
            throw new NotFoundException('No attendance record found for today');
        }

        // Delete the record to reset to "Expected" status
        await this.prisma.attendanceRecord.delete({
            where: { id: record.id },
        });

        return { success: true, message: 'Check-in reversed' };
    }

    /**
     * Undo check-out - reset child to Present (Checked In) status
     */
    async undoCheckOut(childId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await this.prisma.attendanceRecord.findUnique({
            where: {
                childId_date: {
                    childId,
                    date: today,
                },
            },
        });

        if (!record) {
            throw new NotFoundException('No attendance record found for today');
        }

        // Reset to checked-in status, clear checkout info
        return this.prisma.attendanceRecord.update({
            where: { id: record.id },
            data: {
                status: 'CHECKED_IN',
                checkOutTime: null,
                checkedOutBy: null,
                collectedBy: null,
                collectorRelationship: null,
            },
        });
    }

    /**
     * Undo absence - reset child to Expected status
     * Deletes the attendance record for today
     */
    async undoAbsence(childId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await this.prisma.attendanceRecord.findUnique({
            where: {
                childId_date: {
                    childId,
                    date: today,
                },
            },
        });

        if (!record) {
            throw new NotFoundException('No attendance record found for today');
        }

        // Delete the record to reset to "Expected" status
        await this.prisma.attendanceRecord.delete({
            where: { id: record.id },
        });

        return { success: true, message: 'Absence reversed' };
    }
}
