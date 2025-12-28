import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private auditService: AuditService) { }

    /**
     * Get audit logs for the current tenant
     * Only accessible by admins/managers
     */
    @Get('logs')
    async getAuditLogs(
        @Req() req: any,
        @Query('action') action?: string,
        @Query('entityType') entityType?: string,
        @Query('userId') userId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const user = req.user;

        // TODO: Add permission check for AUDIT_VIEW or similar

        return this.auditService.getAuditLogs(user.tenantId, {
            action: action as any,
            entityType,
            userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }
}
