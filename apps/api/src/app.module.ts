import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChildrenModule } from './children/children.module';
import { DailyLogsModule } from './daily-logs/daily-logs.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ParentModule } from './parent/parent.module';
import { BillingModule } from './billing/billing.module';
import { AuditModule } from './audit/audit.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    ChildrenModule,
    DailyLogsModule,
    AttendanceModule,
    ParentModule,
    BillingModule,
    MessagingModule,
  ],
})
export class AppModule { }


