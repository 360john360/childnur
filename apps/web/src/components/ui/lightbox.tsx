'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, FileText, Film, File as FileIcon } from 'lucide-react';

// Types that match the backend ProcessedFile
export interface Attachment {
    id?: string;
    url: string;
    thumbnailUrl?: string | null;
    filename?: string;
    originalFilename?: string;
    size?: number;
    mimetype?: string;
    type?: 'image' | 'video' | 'pdf' | 'document' | 'other';
    dimensions?: { width: number; height: number };
}

interface LightboxProps {
    attachment: Attachment | null;
    isOpen: boolean;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
}

// Helper to determine type from URL if not provided
function getFileType(url: string, mimetype?: string): 'image' | 'video' | 'pdf' | 'document' | 'other' {
    if (mimetype) {
        if (mimetype.startsWith('image/')) return 'image';
        if (mimetype.startsWith('video/')) return 'video';
        if (mimetype === 'application/pdf') return 'pdf';
        if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
    }

    const lowercaseUrl = url.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)/.test(lowercaseUrl)) return 'image';
    if (/\.(mp4|webm|mov|avi|mkv)/.test(lowercaseUrl)) return 'video';
    if (/\.pdf/.test(lowercaseUrl)) return 'pdf';
    if (/\.(doc|docx|xls|xlsx|ppt|pptx)/.test(lowercaseUrl)) return 'document';
    return 'other';
}

export function Lightbox({
    attachment,
    isOpen,
    onClose,
    onNext,
    onPrev,
    hasNext = false,
    hasPrev = false
}: LightboxProps) {
    const [zoom, setZoom] = useState(1);
    const [loading, setLoading] = useState(true);

    const fileType = attachment ? (attachment.type || getFileType(attachment.url, attachment.mimetype)) : 'other';

    // Reset zoom when attachment changes
    useEffect(() => {
        setZoom(1);
        setLoading(true);
    }, [attachment?.url]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowRight':
                    if (hasNext && onNext) onNext();
                    break;
                case 'ArrowLeft':
                    if (hasPrev && onPrev) onPrev();
                    break;
                case '+':
                case '=':
                    setZoom(z => Math.min(z + 0.25, 3));
                    break;
                case '-':
                    setZoom(z => Math.max(z - 0.25, 0.5));
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev]);

    if (!isOpen || !attachment) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/50 rounded-full px-4 py-2">
                {fileType === 'image' && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.25, 0.5)); }}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Zoom out"
                        >
                            <ZoomOut className="h-5 w-5" />
                        </button>
                        <span className="text-white/80 text-sm min-w-[4rem] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.25, 3)); }}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Zoom in"
                        >
                            <ZoomIn className="h-5 w-5" />
                        </button>
                    </>
                )}
                <a
                    href={attachment.url}
                    download={attachment.originalFilename || attachment.filename}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Download"
                >
                    <Download className="h-5 w-5" />
                </a>
            </div>

            {/* Navigation arrows */}
            {hasPrev && onPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <ChevronLeft className="h-8 w-8" />
                </button>
            )}
            {hasNext && onNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <ChevronRight className="h-8 w-8" />
                </button>
            )}

            {/* Content based on file type */}
            <div
                className="max-w-[90vw] max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {loading && fileType !== 'pdf' && fileType !== 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin w-10 h-10 border-2 border-white border-t-transparent rounded-full" />
                    </div>
                )}

                {fileType === 'image' && (
                    <img
                        src={attachment.url}
                        alt={attachment.originalFilename || 'Image'}
                        className="max-w-full max-h-[85vh] object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                        onLoad={() => setLoading(false)}
                        onError={() => setLoading(false)}
                    />
                )}

                {fileType === 'video' && (
                    <video
                        src={attachment.url}
                        controls
                        autoPlay
                        className="max-w-full max-h-[85vh]"
                        onLoadedData={() => setLoading(false)}
                    >
                        Your browser does not support the video tag.
                    </video>
                )}

                {fileType === 'pdf' && (
                    <iframe
                        src={attachment.url}
                        className="w-[80vw] h-[85vh] bg-white rounded-lg"
                        title={attachment.originalFilename || 'PDF'}
                    />
                )}

                {(fileType === 'document' || fileType === 'other') && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
                        <FileIcon className="h-16 w-16 text-white/60 mx-auto mb-4" />
                        <p className="text-white font-medium mb-2">
                            {attachment.originalFilename || attachment.filename || 'File'}
                        </p>
                        {attachment.size && (
                            <p className="text-white/60 text-sm mb-4">
                                {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                        )}
                        <a
                            href={attachment.url}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

// Attachment preview component for chat messages
interface AttachmentPreviewProps {
    attachment: Attachment | string; // Accept string URL for backwards compatibility
    onClickPreview?: (attachment: Attachment) => void;
    isMine?: boolean;
}

export function AttachmentPreview({ attachment, onClickPreview, isMine = false }: AttachmentPreviewProps) {
    // Normalize to Attachment object
    const att: Attachment = typeof attachment === 'string'
        ? { url: attachment, type: getFileType(attachment) }
        : attachment;

    const fileType = att.type || getFileType(att.url, att.mimetype);
    const displayName = att.originalFilename || att.filename || 'File';
    const thumbnailUrl = att.thumbnailUrl || (fileType === 'image' ? att.url : null);

    // Common wrapper styles
    const wrapperClass = `block mt-2 rounded-lg overflow-hidden transition-opacity ${onClickPreview ? 'cursor-pointer hover:opacity-90' : ''
        }`;

    if (fileType === 'image') {
        return (
            <button
                onClick={() => onClickPreview?.(att)}
                className={wrapperClass}
            >
                <img
                    src={thumbnailUrl || att.url}
                    alt={displayName}
                    className="max-w-[200px] max-h-[150px] object-cover rounded-lg"
                    loading="lazy"
                />
            </button>
        );
    }

    if (fileType === 'video') {
        return (
            <button
                onClick={() => onClickPreview?.(att)}
                className={`${wrapperClass} relative`}
            >
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={displayName}
                        className="max-w-[200px] max-h-[150px] object-cover rounded-lg"
                        loading="lazy"
                    />
                ) : (
                    <div className={`w-[200px] h-[120px] rounded-lg flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-muted'
                        }`}>
                        <Film className={`h-10 w-10 ${isMine ? 'text-white/70' : 'text-muted-foreground'}`} />
                    </div>
                )}
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                    </div>
                </div>
            </button>
        );
    }

    if (fileType === 'pdf') {
        return (
            <button
                onClick={() => onClickPreview?.(att)}
                className={`flex items-center gap-3 mt-2 px-3 py-2 rounded-lg transition-colors ${isMine
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
            >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMine ? 'bg-red-500/30' : 'bg-red-500/10'
                    }`}>
                    <FileText className={`h-5 w-5 ${isMine ? 'text-white' : 'text-red-600'}`} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-medium truncate max-w-[150px]">{displayName}</p>
                    <p className={`text-xs ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                        PDF Document
                    </p>
                </div>
            </button>
        );
    }

    // Document and other files
    return (
        <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 mt-2 px-3 py-2 rounded-lg transition-colors ${isMine
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
        >
            <FileIcon className={`h-5 w-5 ${isMine ? 'text-white/70' : 'text-muted-foreground'}`} />
            <div className="text-left">
                <p className="text-sm font-medium truncate max-w-[150px]">{displayName}</p>
                {att.size && (
                    <p className={`text-xs ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {att.size > 1024 * 1024
                            ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
                            : `${(att.size / 1024).toFixed(1)} KB`
                        }
                    </p>
                )}
            </div>
        </a>
    );
}

// Legacy helper for backwards compatibility
export function isImageUrl(url: string): boolean {
    return getFileType(url) === 'image';
}
