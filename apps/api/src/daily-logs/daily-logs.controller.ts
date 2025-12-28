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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DailyLogType } from '@prisma/client';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';

@Controller('daily-logs')
@UseGuards(JwtAuthGuard)
export class DailyLogsController {
    constructor(private dailyLogsService: DailyLogsService) { }

    @Get()
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
    async getRecent(@Request() req: any, @Query('limit') limit?: number) {
        return this.dailyLogsService.getRecentActivity(req.user.tenantId, limit || 10);
    }

    @Get('stats')
    async getStats(@Request() req: any) {
        return this.dailyLogsService.getTodayStats(req.user.tenantId);
    }

    @Get('child/:childId')
    async findByChild(
        @Request() req: any,
        @Param('childId') childId: string,
        @Query('type') type?: DailyLogType,
        @Query('limit') limit?: number,
    ) {
        return this.dailyLogsService.findByChild(childId, req.user.tenantId, { type, limit });
    }

    @Post()
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
