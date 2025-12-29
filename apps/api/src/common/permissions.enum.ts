/**
 * Permission constants for RBAC
 * 
 * These define the granular permissions available in the system.
 * Permissions follow the format: RESOURCE_ACTION
 */
export enum Permission {
    // Child Management
    CHILD_READ = 'CHILD_READ',
    CHILD_WRITE = 'CHILD_WRITE',

    // Attendance
    ATTENDANCE_READ = 'ATTENDANCE_READ',
    ATTENDANCE_WRITE = 'ATTENDANCE_WRITE',

    // Daily Logs
    DAILYLOG_READ = 'DAILYLOG_READ',
    DAILYLOG_WRITE = 'DAILYLOG_WRITE',

    // Observations
    OBSERVATION_READ = 'OBSERVATION_READ',
    OBSERVATION_WRITE = 'OBSERVATION_WRITE',

    // Billing
    BILLING_READ = 'BILLING_READ',
    BILLING_WRITE = 'BILLING_WRITE',

    // Messaging
    MESSAGING_READ = 'MESSAGING_READ',
    MESSAGING_WRITE = 'MESSAGING_WRITE',

    // Announcements
    ANNOUNCEMENTS_READ = 'ANNOUNCEMENTS_READ',
    ANNOUNCEMENTS_WRITE = 'ANNOUNCEMENTS_WRITE',

    // Audit Logs
    AUDIT_READ = 'AUDIT_READ',

    // User Management
    USER_READ = 'USER_READ',
    USER_WRITE = 'USER_WRITE',

    // Staff Management
    STAFF_READ = 'STAFF_READ',
    STAFF_WRITE = 'STAFF_WRITE',

    // Safeguarding (sensitive)
    SAFEGUARDING_READ = 'SAFEGUARDING_READ',
    SAFEGUARDING_WRITE = 'SAFEGUARDING_WRITE',

    // Reports
    REPORTS_READ = 'REPORTS_READ',
}

/**
 * Default permissions by role
 * These are the baseline permissions for each role.
 * Individual users can have additional permissions granted.
 */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, Permission[]> = {
    OWNER: Object.values(Permission), // All permissions
    MANAGER: Object.values(Permission), // All permissions
    DEPUTY: [
        Permission.CHILD_READ,
        Permission.CHILD_WRITE,
        Permission.ATTENDANCE_READ,
        Permission.ATTENDANCE_WRITE,
        Permission.DAILYLOG_READ,
        Permission.DAILYLOG_WRITE,
        Permission.OBSERVATION_READ,
        Permission.OBSERVATION_WRITE,
        Permission.MESSAGING_READ,
        Permission.MESSAGING_WRITE,
        Permission.ANNOUNCEMENTS_READ,
        Permission.ANNOUNCEMENTS_WRITE,
        Permission.STAFF_READ,
        Permission.USER_READ,
        Permission.SAFEGUARDING_READ,
        Permission.REPORTS_READ,
    ],
    ROOM_LEADER: [
        Permission.CHILD_READ,
        Permission.CHILD_WRITE,
        Permission.ATTENDANCE_READ,
        Permission.ATTENDANCE_WRITE,
        Permission.DAILYLOG_READ,
        Permission.DAILYLOG_WRITE,
        Permission.OBSERVATION_READ,
        Permission.OBSERVATION_WRITE,
        Permission.MESSAGING_READ,
        Permission.MESSAGING_WRITE,
        Permission.ANNOUNCEMENTS_READ,
        Permission.STAFF_READ,
    ],
    PRACTITIONER: [
        Permission.CHILD_READ,
        Permission.ATTENDANCE_READ,
        Permission.ATTENDANCE_WRITE,
        Permission.DAILYLOG_READ,
        Permission.DAILYLOG_WRITE,
        Permission.OBSERVATION_READ,
        Permission.OBSERVATION_WRITE,
        Permission.MESSAGING_READ,
        Permission.MESSAGING_WRITE,
        Permission.ANNOUNCEMENTS_READ,
    ],
    ADMIN: [
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.STAFF_READ,
        Permission.STAFF_WRITE,
        Permission.BILLING_READ,
        Permission.BILLING_WRITE,
        Permission.REPORTS_READ,
        Permission.AUDIT_READ,
    ],
    PARENT: [
        // Parents have limited access - mostly read-only for their own children
        // Child ownership checks are handled separately
        Permission.CHILD_READ,
        Permission.DAILYLOG_READ,
        Permission.OBSERVATION_READ,
        Permission.MESSAGING_READ,
        Permission.MESSAGING_WRITE,
        Permission.ANNOUNCEMENTS_READ,
    ],
};

/**
 * Check if a role has a specific permission by default
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
    const permissions = DEFAULT_PERMISSIONS_BY_ROLE[role];
    return permissions?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: string): Permission[] {
    return DEFAULT_PERMISSIONS_BY_ROLE[role] || [];
}
