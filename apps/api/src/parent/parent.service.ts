import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all children linked to the guardians of the authenticated user
     */
    async getMyChildren(userId: string) {
        // First, find the guardian record linked to this user
        const guardian = await this.prisma.guardian.findUnique({
            where: { userId },
            include: {
                children: {
                    include: {
                        child: {
                            include: {
                                room: true,
                                keyPerson: {
                                    include: {
                                        user: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!guardian) {
            throw new NotFoundException('No guardian profile found for this user');
        }

        // Map to a clean response
        return guardian.children.map((cg) => ({
            id: cg.child.id,
            firstName: cg.child.firstName,
            lastName: cg.child.lastName,
            dateOfBirth: cg.child.dateOfBirth,
            profilePhotoUrl: cg.child.profilePhotoUrl,
            room: cg.child.room
                ? {
                    id: cg.child.room.id,
                    name: cg.child.room.name,
                    color: cg.child.room.color,
                }
                : null,
            keyPerson: cg.child.keyPerson
                ? {
                    firstName: cg.child.keyPerson.user.firstName,
                    lastName: cg.child.keyPerson.user.lastName,
                }
                : null,
            isPrimary: cg.isPrimary,
        }));
    }

    /**
     * Get child profile (with authorization check)
     */
    async getChildProfile(userId: string, childId: string) {
        // Verify parent has access to this child
        const hasAccess = await this.verifyParentAccess(userId, childId);
        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this child');
        }

        const child = await this.prisma.child.findUnique({
            where: { id: childId },
            include: {
                room: true,
                keyPerson: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!child) {
            throw new NotFoundException('Child not found');
        }

        return {
            id: child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            dateOfBirth: child.dateOfBirth,
            profilePhotoUrl: child.profilePhotoUrl,
            hasAllergy: child.hasAllergy,
            allergies: child.allergies,
            dietaryRequirements: child.dietaryRequirements,
            room: child.room
                ? {
                    id: child.room.id,
                    name: child.room.name,
                    color: child.room.color,
                }
                : null,
            keyPerson: child.keyPerson
                ? {
                    firstName: child.keyPerson.user.firstName,
                    lastName: child.keyPerson.user.lastName,
                    email: child.keyPerson.user.email,
                }
                : null,
        };
    }

    /**
     * Get child's daily timeline for a specific date
     */
    async getChildTimeline(userId: string, childId: string, date?: Date) {
        // Verify parent has access to this child
        const hasAccess = await this.verifyParentAccess(userId, childId);
        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this child');
        }

        // Default to today if no date provided
        const targetDate = date || new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const logs = await this.prisma.dailyLog.findMany({
            where: {
                childId,
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                // Only show published logs to parents (or all if no status workflow)
                status: 'PUBLISHED',
            },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });

        return logs.map((log) => ({
            id: log.id,
            type: log.type,
            timestamp: log.timestamp,
            data: log.data,
            notes: log.notes,
            mediaUrls: log.mediaUrls,
            author: {
                firstName: log.author.firstName,
                lastName: log.author.lastName,
            },
        }));
    }

    /**
     * Verify that the user (parent) has access to a specific child
     */
    private async verifyParentAccess(userId: string, childId: string): Promise<boolean> {
        const guardian = await this.prisma.guardian.findUnique({
            where: { userId },
            include: {
                children: {
                    where: { childId },
                },
            },
        });

        return guardian !== null && guardian.children.length > 0;
    }
}
