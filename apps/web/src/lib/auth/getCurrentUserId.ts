/**
 * Safely parse the current user ID from the JWT access token.
 * Returns null if token is missing, malformed, or expired.
 */
export function getCurrentUserId(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = JSON.parse(atob(parts[1]));

        // Check for expiration
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            return null;
        }

        return payload.sub || null;
    } catch {
        // Malformed token - return null instead of crashing
        return null;
    }
}

/**
 * Get the user's tenant ID from the JWT access token.
 */
export function getCurrentTenantId(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = JSON.parse(atob(parts[1]));
        return payload.tenantId || null;
    } catch {
        return null;
    }
}

/**
 * Get the user's role from the JWT access token.
 */
export function getCurrentUserRole(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = JSON.parse(atob(parts[1]));
        return payload.role || null;
    } catch {
        return null;
    }
}
