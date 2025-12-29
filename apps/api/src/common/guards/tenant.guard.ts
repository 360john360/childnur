/**
 * Tenant Guard
 * 
 * Ensures that authenticated requests have a valid tenant context.
 * Rejects requests where tenantId is missing (except explicitly public endpoints).
 */
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getTenantIdOptional } from '../tenant-context';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Check if endpoint is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        // For authenticated endpoints, verify tenant context is set
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // If there's no user (not authenticated), let other guards handle it
        if (!user) {
            return true;
        }

        // Verify tenant ID exists
        if (!user.tenantId) {
            throw new ForbiddenException('Tenant context is required for this operation');
        }

        // Also verify the AsyncLocalStorage context is set
        const contextTenantId = getTenantIdOptional();
        if (!contextTenantId) {
            // This shouldn't happen if middleware is configured correctly
            throw new ForbiddenException('Tenant context not initialized');
        }

        // Verify they match
        if (contextTenantId !== user.tenantId) {
            throw new ForbiddenException('Tenant context mismatch');
        }

        return true;
    }
}
