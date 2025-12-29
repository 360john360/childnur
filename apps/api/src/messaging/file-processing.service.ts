import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { join, extname } from 'path';
import { existsSync, mkdirSync, statSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';

export interface ProcessedFile {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    filename: string;
    originalFilename: string;
    size: number;
    originalSize: number;
    mimetype: string;
    type: 'image' | 'video' | 'pdf' | 'document' | 'other';
    dimensions?: { width: number; height: number };
}

export interface FileProcessingOptions {
    generateThumbnail?: boolean;
    compressImages?: boolean;
    convertToWebP?: boolean;
    thumbnailSize?: number;
    imageQuality?: number;
}

const DEFAULT_OPTIONS: FileProcessingOptions = {
    generateThumbnail: true,
    compressImages: true,
    convertToWebP: true,
    thumbnailSize: 300,
    imageQuality: 80,
};

@Injectable()
export class FileProcessingService {
    private readonly logger = new Logger(FileProcessingService.name);
    private readonly uploadDir: string;
    private readonly thumbnailDir: string;
    private readonly apiBaseUrl: string;

    constructor() {
        this.uploadDir = join(process.cwd(), 'uploads', 'messages');
        this.thumbnailDir = join(process.cwd(), 'uploads', 'thumbnails');
        this.apiBaseUrl = process.env.API_URL || 'http://localhost:3001';

        // Ensure directories exist
        [this.uploadDir, this.thumbnailDir].forEach(dir => {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Determine file type from MIME type
     */
    getFileType(mimetype: string): 'image' | 'video' | 'pdf' | 'document' | 'other' {
        if (mimetype.startsWith('image/')) return 'image';
        if (mimetype.startsWith('video/')) return 'video';
        if (mimetype === 'application/pdf') return 'pdf';
        if (mimetype.includes('word') || mimetype.includes('document') || mimetype.includes('spreadsheet')) {
            return 'document';
        }
        return 'other';
    }

    /**
     * Check if file is an image that can be processed by sharp
     */
    isProcessableImage(mimetype: string): boolean {
        const processable = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'];
        return processable.includes(mimetype);
    }

    /**
     * Process an uploaded file - compress, generate thumbnail, extract metadata
     */
    async processFile(
        file: Express.Multer.File,
        options: FileProcessingOptions = {}
    ): Promise<ProcessedFile> {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        const fileId = randomUUID();
        const fileType = this.getFileType(file.mimetype);
        const originalSize = file.size;

        let processedPath = file.path;
        let processedFilename = file.filename;
        let thumbnailUrl: string | null = null;
        let dimensions: { width: number; height: number } | undefined;
        let finalSize = originalSize;

        // Process images
        if (fileType === 'image' && this.isProcessableImage(file.mimetype)) {
            try {
                const result = await this.processImage(file, fileId, opts);
                processedPath = result.path;
                processedFilename = result.filename;
                thumbnailUrl = result.thumbnailUrl;
                dimensions = result.dimensions;
                finalSize = result.size;

                // Remove original if we created a new file
                if (result.path !== file.path && existsSync(file.path)) {
                    unlinkSync(file.path);
                }
            } catch (error) {
                this.logger.error(`Failed to process image: ${error}`);
                // Fall back to original file
            }
        }

        // Generate thumbnail for non-image files
        if (!thumbnailUrl && opts.generateThumbnail) {
            // For PDFs/videos, we could generate thumbnails with ffmpeg/pdf-poppler
            // For now, we'll just skip (could be enhanced later)
        }

        return {
            id: fileId,
            url: `${this.apiBaseUrl}/api/uploads/messages/${processedFilename}`,
            thumbnailUrl,
            filename: processedFilename,
            originalFilename: file.originalname,
            size: finalSize,
            originalSize,
            mimetype: file.mimetype,
            type: fileType,
            dimensions,
        };
    }

    /**
     * Process an image - compress and generate thumbnail
     */
    private async processImage(
        file: Express.Multer.File,
        fileId: string,
        opts: FileProcessingOptions
    ): Promise<{
        path: string;
        filename: string;
        thumbnailUrl: string | null;
        dimensions: { width: number; height: number };
        size: number;
    }> {
        const image = sharp(file.path);
        const metadata = await image.metadata();
        const dimensions = {
            width: metadata.width || 0,
            height: metadata.height || 0,
        };

        // Determine output format
        const outputFormat = opts.convertToWebP ? 'webp' : (metadata.format || 'jpeg');
        const outputExt = opts.convertToWebP ? '.webp' : extname(file.originalname);
        const outputFilename = `${fileId}${outputExt}`;
        const outputPath = join(this.uploadDir, outputFilename);

        // Compress and save
        let pipeline = sharp(file.path);

        // Resize if too large (max 2000px on longest side)
        if (dimensions.width > 2000 || dimensions.height > 2000) {
            pipeline = pipeline.resize(2000, 2000, { fit: 'inside', withoutEnlargement: true });
        }

        if (opts.convertToWebP) {
            pipeline = pipeline.webp({ quality: opts.imageQuality });
        } else if (metadata.format === 'jpeg') {
            pipeline = pipeline.jpeg({ quality: opts.imageQuality });
        } else if (metadata.format === 'png') {
            pipeline = pipeline.png({ compressionLevel: 9 });
        }

        await pipeline.toFile(outputPath);
        const outputStats = statSync(outputPath);

        // Generate thumbnail
        let thumbnailUrl: string | null = null;
        if (opts.generateThumbnail) {
            const thumbFilename = `thumb_${fileId}.webp`;
            const thumbPath = join(this.thumbnailDir, thumbFilename);

            await sharp(file.path)
                .resize(opts.thumbnailSize, opts.thumbnailSize, {
                    fit: 'cover',
                    position: 'center',
                })
                .webp({ quality: 70 })
                .toFile(thumbPath);

            thumbnailUrl = `${this.apiBaseUrl}/api/uploads/thumbnails/${thumbFilename}`;
        }

        return {
            path: outputPath,
            filename: outputFilename,
            thumbnailUrl,
            dimensions,
            size: outputStats.size,
        };
    }

    /**
     * Delete a file and its thumbnail
     */
    async deleteFile(filename: string): Promise<void> {
        const filePath = join(this.uploadDir, filename);
        const thumbPath = join(this.thumbnailDir, `thumb_${filename.replace(/\.[^.]+$/, '.webp')}`);

        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
        if (existsSync(thumbPath)) {
            unlinkSync(thumbPath);
        }
    }
}
