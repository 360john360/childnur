import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface ChildAttendance {
    id: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl: string | null;
    hasAllergy: boolean;
    room: {
        id: string;
        name: string;
        color: string;
    } | null;
    keyPerson: {
        user: {
            firstName: string;
            lastName: string;
        };
    } | null;
    expectedDays: string[];
    attendance: {
        id: string;
        status: "EXPECTED" | "CHECKED_IN" | "CHECKED_OUT" | "ABSENT_NOTIFIED" | "ABSENT_UNNOTIFIED";
        checkInTime: string | null;
        checkOutTime: string | null;
        collectedBy: string | null;
        collectorRelationship: string | null;
        absenceReason: string | null;
    } | null;
}

interface AttendanceStats {
    total: number;
    present: number;
    departed: number;
    absent: number;
    expected: number;
}

/**
 * Get today's attendance register
 */
export function useTodaysAttendance(roomId?: string) {
    return useQuery<ChildAttendance[]>({
        queryKey: ["attendance", "today", roomId],
        queryFn: async () => {
            const params = roomId ? `?roomId=${roomId}` : "";
            const response = await apiClient.get(`/attendance/today${params}`);
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

/**
 * Get attendance statistics
 */
export function useAttendanceStats(roomId?: string) {
    return useQuery<AttendanceStats>({
        queryKey: ["attendance", "stats", roomId],
        queryFn: async () => {
            const params = roomId ? `?roomId=${roomId}` : "";
            const response = await apiClient.get(`/attendance/stats${params}`);
            return response.data;
        },
        refetchInterval: 30000,
    });
}

/**
 * Check in a child
 */
export function useCheckIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childId: string) => {
            const response = await apiClient.post("/attendance/check-in", { childId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });
}

/**
 * Check out a child
 */
export function useCheckOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            childId,
            collectedBy,
            collectorRelationship,
        }: {
            childId: string;
            collectedBy?: string;
            collectorRelationship?: string;
        }) => {
            const response = await apiClient.post("/attendance/check-out", {
                childId,
                collectedBy,
                collectorRelationship,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });
}

/**
 * Bulk check-in multiple children
 */
export function useBulkCheckIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childIds: string[]) => {
            const response = await apiClient.post("/attendance/bulk-check-in", { childIds });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });
}

/**
 * Mark a child as absent
 */
export function useMarkAbsent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            childId,
            reason,
            notified = true,
        }: {
            childId: string;
            reason?: string;
            notified?: boolean;
        }) => {
            const response = await apiClient.post("/attendance/mark-absent", {
                childId,
                reason,
                notified,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });
}

/**
 * Get attendance history for a child
 */
export function useAttendanceHistory(
    childId: string,
    startDate: Date,
    endDate: Date,
) {
    return useQuery({
        queryKey: ["attendance", "history", childId, startDate, endDate],
        queryFn: async () => {
            const response = await apiClient.get(
                `/attendance/history/${childId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            );
            return response.data;
        },
        enabled: !!childId,
    });
}

/**
 * Undo check-in - reset child to Expected status
 */
export function useUndoCheckIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childId: string) => {
            const response = await apiClient.post("/attendance/undo-check-in", { childId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });
}

/**
 * Undo check-out - reset child to Present (Checked In) status
 */
export function useUndoCheckOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childId: string) => {
            const response = await apiClient.post("/attendance/undo-check-out", { childId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });
}

/**
 * Undo absence - reset child to Expected status
 */
export function useUndoAbsence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childId: string) => {
            const response = await apiClient.post("/attendance/undo-absence", { childId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });
}
