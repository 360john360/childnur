/**
 * Roles Decorator
 * 
 * Used to specify which roles are allowed to access an endpoint.
 * 
 * Usage:
 * @RequireRoles(UserRole.MANAGER, UserRole.OWNER)
 * @Get('sensitive-data')
 * async getSensitive() { ... }
 */
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to require specific roles for an endpoint
 * Multiple roles mean any of the specified roles is allowed (OR logic)
 */
export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
