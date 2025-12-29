import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChildrenModule } from './children/children.module';
import { DailyLogsModule } from './daily-logs/daily-logs.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ParentModule } from './parent/parent.module';
import { BillingModule } from './billing/billing.module';
import { AuditModule } from './audit/audit.module';
import { MessagingModule } from './messaging/messaging.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { TenantContextMiddleware } from './common/tenant-context.middleware';
import { TenantGuard } from './common/guards/tenant.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

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
    AnnouncementsModule,
  ],
  providers: [
    // 1. JWT Auth (Authenticates user from token)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2. Tenant Context (Ensures tenantId is present)
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    // 3. Permissions (RBAC Enforcement)
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant context middleware to all routes
    // The middleware will set tenant context from JWT for authenticated requests
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
