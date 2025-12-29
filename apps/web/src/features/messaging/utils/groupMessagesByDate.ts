import { format } from 'date-fns';

export interface Message {
    id: string;
    createdAt: string;
    [key: string]: any;
}

/**
 * Group messages by date for display with date separators
 */
export function groupMessagesByDate<T extends Message>(
    messages: T[] | undefined
): Record<string, T[]> {
    if (!messages) return {};

    return messages.reduce((groups: Record<string, T[]>, msg) => {
        const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(msg);
        return groups;
    }, {});
}

/**
 * Get sorted date keys from grouped messages (oldest first)
 */
export function getSortedDateKeys(groups: Record<string, any[]>): string[] {
    return Object.keys(groups).sort();
}
