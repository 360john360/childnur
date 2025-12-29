import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnnouncementsService } from './announcements.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    /**
     * Get all announcements for the tenant
     */
    @Get()
    @RequirePermissions(Permission.ANNOUNCEMENTS_READ)
    async getAnnouncements(
        @Req() req: any,
        @Query('limit') limit?: string,
        @Query('includeExpired') includeExpired?: string,
    ) {
        return this.announcementsService.getAnnouncements(
            req.user.tenantId,
            req.user.sub,
            {
                limit: limit ? parseInt(limit, 10) : 20,
                includeExpired: includeExpired === 'true',
            }
        );
    }

    /**
     * Get unread count for current user
     */
    @Get('unread-count')
    @RequirePermissions(Permission.ANNOUNCEMENTS_READ)
    async getUnreadCount(@Req() req: any) {
        const count = await this.announcementsService.getUnreadCount(
            req.user.tenantId,
            req.user.sub,
        );
        return { count };
    }

    /**
     * Create a new announcement (staff with write permission only)
     */
    @Post()
    @RequirePermissions(Permission.ANNOUNCEMENTS_WRITE)
    async createAnnouncement(
        @Req() req: any,
        @Body() body: {
            title: string;
            content: string;
            priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
            targetRoomIds?: string[];
            expiresAt?: string;
        },
    ) {
        return this.announcementsService.createAnnouncement(
            req.user.tenantId,
            req.user.sub,
            {
                ...body,
                expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
            }
        );
    }

    /**
     * Mark an announcement as read
     */
    @Patch(':id/read')
    @RequirePermissions(Permission.ANNOUNCEMENTS_READ)
    async markAsRead(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.announcementsService.markAsRead(id, req.user.sub, req.user.tenantId);
    }

    /**
     * Delete an announcement (requires write permission)
     */
    @Delete(':id')
    @RequirePermissions(Permission.ANNOUNCEMENTS_WRITE)
    async deleteAnnouncement(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.announcementsService.deleteAnnouncement(id, req.user.sub);
    }
}
