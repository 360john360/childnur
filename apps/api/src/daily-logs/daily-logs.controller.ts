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
import { DailyLogsService } from './daily-logs.service';
import { Permission } from '../common/permissions.enum';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { DailyLogType } from '@prisma/client';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';

@Controller('daily-logs')
export class DailyLogsController {
    constructor(private dailyLogsService: DailyLogsService) { }

    @Get()
    @RequirePermissions(Permission.DAILYLOG_READ)
    async findAll(
        @Request() req: any,
        @Query('childId') childId?: string,
        @Query('type') type?: DailyLogType,
        @Query('date') date?: string,
        @Query('limit') limit?: number,
    ) {
        return this.dailyLogsService.findAll(req.user.tenantId, {
            childId,
            type,
            date: date ? new Date(date) : undefined,
            limit,
        });
    }

    @Get('recent')
    @RequirePermissions(Permission.DAILYLOG_READ)
    async getRecent(@Request() req: any, @Query('limit') limit?: number) {
        return this.dailyLogsService.getRecentActivity(req.user.tenantId, limit || 10);
    }

    @Get('stats')
    @RequirePermissions(Permission.DAILYLOG_READ)
    async getStats(@Request() req: any) {
        return this.dailyLogsService.getTodayStats(req.user.tenantId);
    }

    @Get('child/:childId')
    @RequirePermissions(Permission.DAILYLOG_READ)
    async findByChild(
        @Request() req: any,
        @Param('childId') childId: string,
        @Query('type') type?: DailyLogType,
        @Query('limit') limit?: number,
    ) {
        return this.dailyLogsService.findByChild(childId, req.user.tenantId, { type, limit });
    }

    @Post()
    @RequirePermissions(Permission.DAILYLOG_WRITE)
    async create(@Request() req: any, @Body() createDto: CreateDailyLogDto) {
        return this.dailyLogsService.create({
            tenantId: req.user.tenantId,
            authorId: req.user.sub,
            childId: createDto.childId,
            type: createDto.type,
            data: createDto.data,
            notes: createDto.notes,
            timestamp: createDto.timestamp ? new Date(createDto.timestamp) : undefined,
        });
    }
}
