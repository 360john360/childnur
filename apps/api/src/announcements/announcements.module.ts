import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';

@Module({
    imports: [AuthModule, PrismaModule],
    providers: [AnnouncementsService],
    controllers: [AnnouncementsController],
    exports: [AnnouncementsService],
})
export class AnnouncementsModule { }
