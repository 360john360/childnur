import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { UploadController } from './upload.controller';
import { FileProcessingService } from './file-processing.service';

@Module({
    imports: [AuthModule], // Import AuthModule which exports JwtModule with correct secret
    providers: [MessagingService, MessagingGateway, FileProcessingService],
    controllers: [MessagingController, UploadController],
    exports: [MessagingService],
})
export class MessagingModule { }
