"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useRecentActivity(limit = 10) {
    return useQuery({
        queryKey: ['daily-logs', 'recent', limit],
        queryFn: () => api.getRecentActivity(limit),
        staleTime: 15 * 1000, // 15 seconds - activity updates frequently
        refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    });
}

export function useDailyLogs(options?: { childId?: string; limit?: number }) {
    return useQuery({
        queryKey: ['daily-logs', options],
        queryFn: () => api.getDailyLogs(options),
        staleTime: 30 * 1000,
    });
}

export function useCreateDailyLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            childId: string;
            type: string;
            data: Record<string, any>;
            notes?: string;
        }) => api.createDailyLog(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
        },
    });
}
