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

@Controller('parent')
@UseGuards(JwtAuthGuard)
export class ParentController {
    constructor(private parentService: ParentService) { }

    /**
     * GET /api/parent/children
     * Get all children linked to the authenticated parent
     */
    @Get('children')
    async getMyChildren(@Request() req: any) {
        return this.parentService.getMyChildren(req.user.sub);
    }

    /**
     * GET /api/parent/children/:childId/profile
     * Get a child's profile (with authorization)
     */
    @Get('children/:childId/profile')
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
    async getChildTimeline(
        @Request() req: any,
        @Param('childId') childId: string,
        @Query('date') date?: string,
    ) {
        const targetDate = date ? new Date(date) : undefined;
        return this.parentService.getChildTimeline(req.user.sub, childId, targetDate);
    }
}
