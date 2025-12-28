"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useChildStats() {
    return useQuery({
        queryKey: ['children', 'stats'],
        queryFn: () => api.getChildStats(),
        staleTime: 30 * 1000, // 30 seconds
    });
}

export function useChildren(options?: { roomId?: string; search?: string }) {
    return useQuery({
        queryKey: ['children', options],
        queryFn: () => api.getChildren(options),
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useChild(id: string) {
    return useQuery({
        queryKey: ['children', id],
        queryFn: () => api.getChild(id),
        enabled: !!id,
    });
}

export function useChildrenWithAllergies() {
    return useQuery({
        queryKey: ['children', 'allergies'],
        queryFn: () => api.getChildrenWithAllergies(),
    });
}

export function useRooms() {
    return useQuery({
        queryKey: ['rooms'],
        queryFn: () => api.getRooms(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

