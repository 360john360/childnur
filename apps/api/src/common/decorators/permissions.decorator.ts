/**
 * Permissions Decorator
 * 
 * Used to specify which permissions are required to access an endpoint.
 * 
 * Usage:
 * @RequirePermissions(Permission.BILLING_WRITE)
 * @Post('invoices')
 * async createInvoice() { ... }
 */
import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions.enum';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for an endpoint
 * Multiple permissions mean ALL specified permissions are required (AND logic)
 */
export const RequirePermissions = (...permissions: Permission[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);
