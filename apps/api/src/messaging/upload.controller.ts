import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { FileProcessingService, ProcessedFile } from './file-processing.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'messages');

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, callback) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        callback(null, uniqueName);
    },
});

const fileFilter = (req: any, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) => {
    // Allow images, videos, PDFs, and common document types
    const allowedMimes = [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff',
        // Videos
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new BadRequestException(`File type ${file.mimetype} is not allowed`), false);
    }
};

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly fileProcessingService: FileProcessingService) { }

    /**
     * Upload a single file for message attachment
     * Returns processed file with compression and thumbnail
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage,
        fileFilter,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max (larger for videos)
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<ProcessedFile> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Process the file (compress, generate thumbnail, etc.)
        const processed = await this.fileProcessingService.processFile(file, {
            compressImages: true,
            convertToWebP: true,
            generateThumbnail: true,
            thumbnailSize: 300,
            imageQuality: 80,
        });

        return processed;
    }

    /**
     * Upload multiple files
     */
    @Post('upload-multiple')
    @UseInterceptors(FilesInterceptor('files', 5, {
        storage,
        fileFilter,
        limits: { fileSize: 50 * 1024 * 1024 },
    }))
    async uploadFiles(@UploadedFiles() files: Express.Multer.File[]): Promise<ProcessedFile[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        const processed = await Promise.all(
            files.map(file => this.fileProcessingService.processFile(file))
        );

        return processed;
    }
}
