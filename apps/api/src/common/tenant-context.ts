/**
 * Tenant Context using AsyncLocalStorage
 * 
 * Provides request-scoped tenant isolation without passing tenantId everywhere.
 * The tenant context is set once per request and available throughout the request lifecycle.
 */
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
    tenantId: string;
    userId?: string;
    role?: string;
}

// Create the AsyncLocalStorage instance
const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Get the current tenant ID from the request context
 * @throws Error if called outside of a request context
 */
export function getTenantId(): string {
    const context = tenantStorage.getStore();
    if (!context?.tenantId) {
        throw new Error('Tenant context not set. This operation must be performed within a request context.');
    }
    return context.tenantId;
}

/**
 * Get the current tenant ID, returning undefined if not in a request context
 * Useful for optional tenant scoping
 */
export function getTenantIdOptional(): string | undefined {
    return tenantStorage.getStore()?.tenantId;
}

/**
 * Get the current user ID from the request context
 */
export function getUserId(): string | undefined {
    return tenantStorage.getStore()?.userId;
}

/**
 * Get the full tenant context
 */
export function getTenantContext(): TenantContext | undefined {
    return tenantStorage.getStore();
}

/**
 * Run a function within a tenant context
 * Used by the middleware to wrap each request
 */
export function runWithTenantContext<T>(
    context: TenantContext,
    fn: () => T
): T {
    return tenantStorage.run(context, fn);
}

/**
 * Run an async function within a tenant context
 * Used by the middleware to wrap each request
 */
export async function runWithTenantContextAsync<T>(
    context: TenantContext,
    fn: () => Promise<T>
): Promise<T> {
    return tenantStorage.run(context, fn);
}

export { tenantStorage };
