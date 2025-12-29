/**
 * Get priority-based color classes for announcements
 */
export function getPriorityColor(priority: string): string {
    switch (priority) {
        case 'URGENT':
            return 'bg-red-500/10 text-red-600 border-red-500/30';
        case 'HIGH':
            return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
        case 'LOW':
            return 'bg-muted text-muted-foreground border-muted';
        case 'NORMAL':
        default:
            return 'bg-primary/10 text-primary border-primary/30';
    }
}

/**
 * Get priority label with emoji
 */
export function getPriorityLabel(priority: string): string {
    switch (priority) {
        case 'URGENT':
            return '🚨 Urgent';
        case 'HIGH':
            return '⚠️ High';
        case 'LOW':
            return 'Low';
        case 'NORMAL':
        default:
            return 'Normal';
    }
}
