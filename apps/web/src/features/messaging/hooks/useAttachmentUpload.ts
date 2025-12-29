'use client';

import { useState, useCallback, ChangeEvent } from 'react';
import { uploadAttachments, validateFile, Attachment } from '../services/uploadService';

export interface UseAttachmentUploadReturn {
    attachments: Attachment[];
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
    handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
    removeAttachment: (index: number) => void;
    clearAttachments: () => void;
    getAttachmentUrls: () => string[];
}

/**
 * Hook for managing file attachments with upload progress
 */
export function useAttachmentUpload(): UseAttachmentUploadReturn {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate all files first
        for (const file of files) {
            const validation = validateFile(file);
            if (!validation.valid) {
                setError(validation.error || 'Invalid file');
                return;
            }
        }

        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const uploaded = await uploadAttachments(files, (progress) => {
                setUploadProgress(progress.percentage);
            });

            setAttachments(prev => [...prev, ...uploaded]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            // Reset file input
            e.target.value = '';
        }
    }, []);

    const removeAttachment = useCallback((index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearAttachments = useCallback(() => {
        setAttachments([]);
        setError(null);
    }, []);

    const getAttachmentUrls = useCallback(() => {
        return attachments.map(a => a.url);
    }, [attachments]);

    return {
        attachments,
        isUploading,
        uploadProgress,
        error,
        handleFileSelect,
        removeAttachment,
        clearAttachments,
        getAttachmentUrls,
    };
}
