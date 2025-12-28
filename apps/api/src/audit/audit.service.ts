import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { Request } from 'express';

interface AuditLogParams {
    tenantId: string;
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    previousData?: Record<string, any>;
    newData?: Record<string, any>;
    request?: Request;
}

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    /**
     * Log an audit event
     * This is fire-and-forget - we don't want audit logging to slow down the main request
     */
    async log(params: AuditLogParams): Promise<void> {
        try {
            const { tenantId, userId, action, entityType, entityId, previousData, newData, request } = params;

            // Extract request details
            const ipAddress = request ? this.extractIpAddress(request) : undefined;
            const userAgent = request?.headers['user-agent'];

            await this.prisma.auditLog.create({
                data: {
                    tenantId,
                    userId,
                    action,
                    entityType,
                    entityId,
                    previousData: previousData ? previousData : undefined,
                    newData: newData ? newData : undefined,
                    ipAddress,
                    userAgent,
                },
            });
        } catch (error) {
            // Log error but don't throw - audit logging should not break main flow
            console.error('[AuditService] Failed to create audit log:', error);
        }
    }

    /**
     * Log a login event
     */
    async logLogin(tenantId: string, userId: string, request?: Request): Promise<void> {
        await this.log({
            tenantId,
            userId,
            action: 'LOGIN',
            entityType: 'User',
            entityId: userId,
            request,
        });
    }

    /**
     * Log a logout event
     */
    async logLogout(tenantId: string, userId: string, request?: Request): Promise<void> {
        await this.log({
            tenantId,
            userId,
            action: 'LOGOUT',
            entityType: 'User',
            entityId: userId,
            request,
        });
    }

    /**
     * Log a data export (GDPR SAR)
     */
    async logExport(tenantId: string, userId: string, entityType: string, entityId?: string, request?: Request): Promise<void> {
        await this.log({
            tenantId,
            userId,
            action: 'EXPORT',
            entityType,
            entityId,
            request,
        });
    }

    /**
     * Log access to sensitive record (e.g., safeguarding)
     */
    async logSensitiveAccess(tenantId: string, userId: string, entityType: string, entityId: string, request?: Request): Promise<void> {
        await this.log({
            tenantId,
            userId,
            action: 'READ',
            entityType,
            entityId,
            request,
        });
    }

    /**
     * Log a permission change
     */
    async logPermissionChange(
        tenantId: string,
        userId: string,
        targetUserId: string,
        previousPermissions: string[],
        newPermissions: string[],
        request?: Request
    ): Promise<void> {
        await this.log({
            tenantId,
            userId,
            action: 'PERMISSION_CHANGE',
            entityType: 'User',
            entityId: targetUserId,
            previousData: { permissions: previousPermissions },
            newData: { permissions: newPermissions },
            request,
        });
    }

    /**
     * Get audit logs for a tenant (with pagination)
     */
    async getAuditLogs(
        tenantId: string,
        options?: {
            action?: AuditAction;
            entityType?: string;
            userId?: string;
            startDate?: Date;
            endDate?: Date;
            limit?: number;
            offset?: number;
        }
    ) {
        const where: any = { tenantId };

        if (options?.action) {
            where.action = options.action;
        }
        if (options?.entityType) {
            where.entityType = options.entityType;
        }
        if (options?.userId) {
            where.userId = options.userId;
        }
        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: options?.limit || 50,
                skip: options?.offset || 0,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { logs, total };
    }

    /**
     * Extract IP address from request (handles proxies)
     */
    private extractIpAddress(request: Request): string | undefined {
        const forwarded = request.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        if (Array.isArray(forwarded) && forwarded.length > 0) {
            return forwarded[0];
        }
        return request.ip || request.socket?.remoteAddress;
    }
}
