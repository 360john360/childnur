import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

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
    // Allow images, PDFs, and common document types
    const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
    /**
     * Upload a single file for message attachment
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage,
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Return the URL that can be used to access the file
        const fileUrl = `/api/uploads/messages/${file.filename}`;

        return {
            url: fileUrl,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    /**
     * Upload multiple files
     */
    @Post('upload-multiple')
    @UseInterceptors(FilesInterceptor('files', 5, {
        storage,
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 },
    }))
    uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        return files.map(file => ({
            url: `/api/uploads/messages/${file.filename}`,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        }));
    }
}
