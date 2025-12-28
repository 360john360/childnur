// API Client for NurseryHub
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiError {
    message: string;
    statusCode: number;
}

class ApiClient {
    private accessToken: string | null = null;

    constructor() {
        // Load token from localStorage on client
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('accessToken');
        }
    }

    setToken(token: string | null) {
        this.accessToken = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('accessToken', token);
            } else {
                localStorage.removeItem('accessToken');
            }
        }
    }

    getToken(): string | null {
        return this.accessToken;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.accessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                message: 'Network error',
                statusCode: response.status,
            }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth endpoints
    async login(email: string, password: string) {
        const data = await this.request<{
            accessToken: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: string;
                tenantId: string;
                tenantName: string;
            };
        }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        this.setToken(data.accessToken);

        // Store user data for tenant-aware UI
        if (typeof window !== 'undefined' && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    }

    async logout() {
        this.setToken(null);
    }

    async getProfile() {
        return this.request<{
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            tenant: { id: string; name: string; primaryColor: string };
        }>('/auth/profile');
    }

    // Children endpoints
    async getChildren(options?: { roomId?: string; search?: string }) {
        const params = new URLSearchParams();
        if (options?.roomId) params.append('roomId', options.roomId);
        if (options?.search) params.append('search', options.search);
        const query = params.toString() ? `?${params}` : '';
        return this.request<any[]>(`/children${query}`);
    }

    async getChildStats() {
        return this.request<{
            totalChildren: number;
            presentToday: number;
            absentToday: number;
            withAllergies: number;
            totalRooms: number;
        }>('/children/stats');
    }

    async getChildrenWithAllergies() {
        return this.request<any[]>('/children/allergies');
    }

    async getChild(id: string) {
        return this.request<any>(`/children/${id}`);
    }

    async getRooms() {
        return this.request<any[]>('/children/rooms');
    }

    // Daily logs endpoints
    async getDailyLogs(options?: { childId?: string; limit?: number }) {
        const params = new URLSearchParams();
        if (options?.childId) params.append('childId', options.childId);
        if (options?.limit) params.append('limit', options.limit.toString());
        const query = params.toString() ? `?${params}` : '';
        return this.request<any[]>(`/daily-logs${query}`);
    }

    async getRecentActivity(limit = 10) {
        return this.request<any[]>(`/daily-logs/recent?limit=${limit}`);
    }

    async createDailyLog(data: {
        childId: string;
        type: string;
        data: Record<string, any>;
        notes?: string;
    }) {
        return this.request<any>('/daily-logs', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

export const api = new ApiClient();
