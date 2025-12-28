import { Module } from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { DailyLogsController } from './daily-logs.controller';

@Module({
    providers: [DailyLogsService],
    controllers: [DailyLogsController],
    exports: [DailyLogsService],
})
export class DailyLogsModule { }
