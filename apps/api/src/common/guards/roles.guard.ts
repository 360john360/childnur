/**
 * Roles Guard
 * 
 * Checks if the authenticated user has one of the required roles.
 * Used in conjunction with @RequireRoles decorator.
 */
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Get required roles from decorator metadata
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles specified, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Get user from request
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Check if user has one of the required roles (OR logic)
        const hasRole = requiredRoles.some(role => user.role === role);

        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required role: ${requiredRoles.join(' or ')}`
            );
        }

        return true;
    }
}
