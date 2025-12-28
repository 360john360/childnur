import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChildrenModule } from './children/children.module';
import { DailyLogsModule } from './daily-logs/daily-logs.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    AuthModule,
    ChildrenModule,
    DailyLogsModule,
    AttendanceModule,
  ],
})
export class AppModule { }

