'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ClipboardCheck, Baby, Utensils, Moon, Camera } from 'lucide-react';
import { format } from 'date-fns';

export const logTypeIcons: Record<string, any> = {
    NAPPY: Baby,
    MEAL: Utensils,
    SLEEP: Moon,
    ACTIVITY: Camera,
    NOTE: ClipboardCheck,
};

export const logTypeColors: Record<string, string> = {
    NAPPY: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400',
    MEAL: 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400',
    SLEEP: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400',
    ACTIVITY: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400',
    NOTE: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400',
};

export interface LogEntry {
    id: string;
    type: string;
    timestamp: string;
    notes?: string;
    data?: any;
    childId: string;
    child?: {
        firstName: string;
        lastName: string;
        hasAllergy?: boolean;
        room?: { name: string };
    };
}

export interface LogCardProps {
    log: LogEntry;
    index: number;
    formatLogData: (type: string, data: any) => string;
}

export function LogCard({ log, index, formatLogData }: LogCardProps) {
    const Icon = logTypeIcons[log.type] || ClipboardCheck;
    const colorClass = logTypeColors[log.type] || logTypeColors.NOTE;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
            <div className={`p-2 rounded-lg ${colorClass} border shrink-0`}>
                <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/children/${log.childId}`} className="hover:underline">
                        <span className="font-medium text-sm">
                            {log.child?.firstName} {log.child?.lastName}
                        </span>
                    </Link>
                    {log.child?.hasAllergy && (
                        <Badge variant="destructive" className="text-xs px-1">
                            <AlertTriangle className="h-3 w-3" />
                        </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                        {log.child?.room?.name}
                    </Badge>
                </div>

                <p className="text-sm text-muted-foreground mt-0.5">
                    {log.notes || formatLogData(log.type, log.data)}
                </p>
            </div>

            <div className="text-xs text-muted-foreground shrink-0">
                {format(new Date(log.timestamp), 'HH:mm')}
            </div>
        </motion.div>
    );
}
