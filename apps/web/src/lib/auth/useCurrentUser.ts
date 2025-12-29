'use client';

import { useState, useEffect } from 'react';
import { getCurrentUserId, getCurrentTenantId, getCurrentUserRole } from './getCurrentUserId';

interface CurrentUser {
    userId: string | null;
    tenantId: string | null;
    role: string | null;
    isAuthenticated: boolean;
}

/**
 * React hook for accessing current user info from JWT.
 * Handles SSR safely by only reading token on client.
 */
export function useCurrentUser(): CurrentUser {
    const [user, setUser] = useState<CurrentUser>({
        userId: null,
        tenantId: null,
        role: null,
        isAuthenticated: false,
    });

    useEffect(() => {
        const userId = getCurrentUserId();
        const tenantId = getCurrentTenantId();
        const role = getCurrentUserRole();

        setUser({
            userId,
            tenantId,
            role,
            isAuthenticated: !!userId,
        });
    }, []);

    return user;
}

/**
 * Simple hook for just the user ID
 */
export function useCurrentUserId(): string | null {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        setUserId(getCurrentUserId());
    }, []);

    return userId;
}
