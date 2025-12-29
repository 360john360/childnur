
/**
 * Permissions Guard
 * 
 * Checks if the authenticated user has the required permissions.
 * Uses both:
 * 1. Default permissions based on user role
 * 2. Additional permissions stored on user record
 */
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission, getPermissionsForRole } from '../permissions.enum';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_JWT_ONLY_ALLOWED_KEY } from '../decorators/jwt-only.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1. Check if public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        // 2. Get User (Guaranteed to exist if JwtAuthGuard ran first)
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            // Should be caught by JwtAuthGuard, but safety check
            throw new ForbiddenException('Authentication required');
        }

        // 3. Check for specific permissions
        const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (requiredPermissions && requiredPermissions.length > 0) {
            // Check permissions
            const userPermissions = this.getUserPermissions(user);
            const hasAllPermissions = requiredPermissions.every(permission =>
                userPermissions.includes(permission)
            );

            if (!hasAllPermissions) {
                const missingPermissions = requiredPermissions.filter(
                    p => !userPermissions.includes(p)
                );
                throw new ForbiddenException(
                    `Access denied. Missing permissions: ${missingPermissions.join(', ')}`
                );
            }
            return true;
        }

        // 4. Check for JwtOnlyAllowed escape hatch
        const isJwtOnly = this.reflector.getAllAndOverride<boolean>(IS_JWT_ONLY_ALLOWED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isJwtOnly) {
            return true;
        }

        // 5. Default Deny
        throw new ForbiddenException(
            'Access denied. No permissions metadata configured for this route.'
        );
    }

    /**
     * Get the effective permissions for a user
     * Combines default role permissions with any additional user-specific permissions
     */
    private getUserPermissions(user: any): Permission[] {
        // Get default permissions from role
        const rolePermissions = getPermissionsForRole(user.role);

        // Get additional permissions from user record (if any)
        const additionalPermissions: Permission[] = user.permissions || [];

        // Combine and deduplicate
        const allPermissions = new Set([...rolePermissions, ...additionalPermissions]);

        return Array.from(allPermissions);
    }
}
