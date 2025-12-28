// Re-export API client with axios-like interface for compatibility
// Uses native fetch instead of axios

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        if (token) {
            (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }
    }

    return headers;
}

export const apiClient = {
    async get<T = any>(url: string): Promise<{ data: T }> {
        const response = await fetch(`${API_URL}${url}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return { data };
    },

    async post<T = any>(url: string, body?: any): Promise<{ data: T }> {
        const response = await fetch(`${API_URL}${url}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return { data };
    },
};
