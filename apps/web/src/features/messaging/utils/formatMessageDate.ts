import { format, isToday, isYesterday } from 'date-fns';

/**
 * Format a message timestamp for display
 */
export function formatMessageDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isToday(d)) {
        return format(d, 'h:mm a');
    }

    if (isYesterday(d)) {
        return 'Yesterday ' + format(d, 'h:mm a');
    }

    return format(d, 'MMM d, h:mm a');
}

/**
 * Format a date for group headers
 */
export function formatDateGroupHeader(dateKey: string): string {
    const date = new Date(dateKey);

    if (isToday(date)) {
        return 'Today';
    }

    if (isYesterday(date)) {
        return 'Yesterday';
    }

    return format(date, 'EEEE, MMMM d, yyyy');
}
