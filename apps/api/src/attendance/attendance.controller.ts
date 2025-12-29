import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttendanceService } from './attendance.service';

import { Permission } from '../common/permissions.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('attendance')
export class AttendanceController {
    constructor(private attendanceService: AttendanceService) { }

    /**
     * GET /api/attendance/today
     * Get today's attendance register, optionally filtered by room
     */
    @Get('today')
    async getTodaysAttendance(
        @Request() req: any,
        @Query('roomId') roomId?: string,
    ) {
        return this.attendanceService.getTodaysAttendance(req.user.tenantId, roomId);
    }

    /**
     * GET /api/attendance/stats
     * Get attendance statistics for today
     */
    @Get('stats')
    async getAttendanceStats(
        @Request() req: any,
        @Query('roomId') roomId?: string,
    ) {
        return this.attendanceService.getAttendanceStats(req.user.tenantId, roomId);
    }

    /**
     * POST /api/attendance/check-in
     * Check in a single child
     */
    @Post('check-in')
    async checkIn(
        @Request() req: any,
        @Body() body: { childId: string },
    ) {
        return this.attendanceService.checkIn(req.user.tenantId, body.childId, req.user.sub);
    }

    /**
     * POST /api/attendance/check-out
     * Check out a child with collector information
     */
    @Post('check-out')
    async checkOut(
        @Request() req: any,
        @Body()
        body: {
            childId: string;
            collectedBy?: string;
            collectorRelationship?: string;
        },
    ) {
        return this.attendanceService.checkOut(
            body.childId,
            req.user.sub,
            body.collectedBy,
            body.collectorRelationship,
        );
    }

    /**
     * POST /api/attendance/bulk-check-in
     * Check in multiple children at once
     */
    @Post('bulk-check-in')
    @RequirePermissions(Permission.ATTENDANCE_WRITE)
    async bulkCheckIn(
        @Request() req: any,
        @Body() body: { childIds: string[] },
    ) {
        return this.attendanceService.bulkCheckIn(req.user.tenantId, body.childIds, req.user.sub);
    }

    /**
     * POST /api/attendance/mark-absent
     * Mark a child as absent
     */
    @Post('mark-absent')
    async markAbsent(
        @Request() req: any,
        @Body()
        body: {
            childId: string;
            reason?: string;
            notified?: boolean;
        },
    ) {
        return this.attendanceService.markAbsent(
            req.user.tenantId,
            body.childId,
            body.reason,
            body.notified ?? true,
        );
    }

    /**
     * GET /api/attendance/history/:childId
     * Get attendance history for a child
     */
    @Get('history/:childId')
    async getAttendanceHistory(
        @Param('childId') childId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.attendanceService.getAttendanceHistory(
            childId,
            new Date(startDate),
            new Date(endDate),
        );
    }

    /**
     * POST /api/attendance/undo-check-in
     * Undo a check-in, resetting child to Expected status
     */
    @Post('undo-check-in')
    async undoCheckIn(@Body() body: { childId: string }) {
        return this.attendanceService.undoCheckIn(body.childId);
    }

    /**
     * POST /api/attendance/undo-check-out
     * Undo a check-out, resetting child to Present (Checked In) status
     */
    @Post('undo-check-out')
    async undoCheckOut(@Body() body: { childId: string }) {
        return this.attendanceService.undoCheckOut(body.childId);
    }

    /**
     * POST /api/attendance/undo-absence
     * Undo an absence, resetting child to Expected status
     */
    @Post('undo-absence')
    async undoAbsence(@Body() body: { childId: string }) {
        return this.attendanceService.undoAbsence(body.childId);
    }
}
