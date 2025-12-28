import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface ChildSummary {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    profilePhotoUrl: string | null;
    room: {
        id: string;
        name: string;
        color: string;
    } | null;
    keyPerson: {
        firstName: string;
        lastName: string;
    } | null;
    isPrimary: boolean;
}

interface ChildProfile extends ChildSummary {
    hasAllergy: boolean;
    allergies: any[];
    dietaryRequirements: string[];
}

interface TimelineEntry {
    id: string;
    type: string;
    timestamp: string;
    data: any;
    notes: string | null;
    mediaUrls: string[];
    author: {
        firstName: string;
        lastName: string;
    };
}

/**
 * Get all children linked to the authenticated parent
 */
export function useMyChildren() {
    return useQuery<ChildSummary[]>({
        queryKey: ["parent", "children"],
        queryFn: async () => {
            const response = await apiClient.get("/parent/children");
            return response.data;
        },
    });
}

/**
 * Get a child's profile
 */
export function useChildProfile(childId: string) {
    return useQuery<ChildProfile>({
        queryKey: ["parent", "children", childId, "profile"],
        queryFn: async () => {
            const response = await apiClient.get(`/parent/children/${childId}/profile`);
            return response.data;
        },
        enabled: !!childId,
    });
}

/**
 * Get a child's daily timeline
 */
export function useChildTimeline(childId: string, date?: Date) {
    const dateStr = date?.toISOString().split("T")[0];

    return useQuery<TimelineEntry[]>({
        queryKey: ["parent", "children", childId, "timeline", dateStr],
        queryFn: async () => {
            const params = dateStr ? `?date=${dateStr}` : "";
            const response = await apiClient.get(`/parent/children/${childId}/timeline${params}`);
            return response.data;
        },
        enabled: !!childId,
        refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
    });
}
