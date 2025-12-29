import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParentService } from './parent.service';
import { ChildOwnerGuard } from '../common/guards/child-owner.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('parent')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ParentController {
    constructor(private parentService: ParentService) { }

    /**
     * GET /api/parent/children
     * Get all children linked to the authenticated parent
     */
    @Get('children')
    @RequirePermissions(Permission.CHILD_READ)
    async getMyChildren(@Request() req: any) {
        return this.parentService.getMyChildren(req.user.sub);
    }

    /**
     * GET /api/parent/children/:childId/profile
     * Get a child's profile (with authorization)
     */
    @Get('children/:childId/profile')
    @UseGuards(ChildOwnerGuard)
    @RequirePermissions(Permission.CHILD_READ)
    async getChildProfile(
        @Request() req: any,
        @Param('childId') childId: string,
    ) {
        return this.parentService.getChildProfile(req.user.sub, childId);
    }

    /**
     * GET /api/parent/children/:childId/timeline
     * Get a child's daily timeline
     */
    @Get('children/:childId/timeline')
    @UseGuards(ChildOwnerGuard)
    @RequirePermissions(Permission.DAILYLOG_READ)
    async getChildTimeline(
        @Request() req: any,
        @Param('childId') childId: string,
        @Query('date') date?: string,
    ) {
        const targetDate = date ? new Date(date) : undefined;
        return this.parentService.getChildTimeline(req.user.sub, childId, targetDate);
    }
}
