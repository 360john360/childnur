'use client';

import { UserCheck, Clock, LogOut, UserX } from 'lucide-react';

export interface AttendanceStats {
    present: number;
    expected: number;
    departed: number;
    absent: number;
}

export interface AttendanceStatsBarProps {
    stats: AttendanceStats | undefined;
}

export function AttendanceStatsBar({ stats }: AttendanceStatsBarProps) {
    const statItems = [
        { value: stats?.present || 0, label: 'Present', icon: UserCheck, gradient: 'from-green-500 to-emerald-500' },
        { value: stats?.expected || 0, label: 'Expected', icon: Clock, gradient: 'from-amber-500 to-orange-500' },
        { value: stats?.departed || 0, label: 'Departed', icon: LogOut, gradient: 'from-blue-500 to-cyan-500' },
        { value: stats?.absent || 0, label: 'Absent', icon: UserX, gradient: 'from-gray-500 to-slate-500' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((item) => (
                <div key={item.label} className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient}`}>
                            <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
