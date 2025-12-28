"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Baby,
    Users,
    ClipboardList,
    AlertTriangle,
    Clock,
    Camera,
    Utensils,
    Moon,
    ArrowRight,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useChildStats } from "@/hooks/use-children";
import { useRecentActivity } from "@/hooks/use-daily-logs";
import { formatDistanceToNow } from "date-fns";

// Activity type to icon mapping
const activityIcons: Record<string, any> = {
    NAPPY: Baby,
    MEAL: Utensils,
    SLEEP: Moon,
    ACTIVITY: Camera,
    NOTE: ClipboardList,
    default: ClipboardList,
};

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: stats, isLoading: statsLoading } = useChildStats();
    const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(8);

    // Use client-side state for time-based greeting to avoid hydration mismatch
    const [greeting, setGreeting] = useState("Welcome");
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 17) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    const statCards = [
        {
            label: "Children Present",
            value: stats?.presentToday ?? '-',
            total: stats?.totalChildren ?? '-',
            icon: Users,
            color: "from-emerald-500 to-teal-500",
            glow: "shadow-emerald-500/20",
        },
        {
            label: "Total Children",
            value: stats?.totalChildren ?? '-',
            icon: Baby,
            color: "from-violet-500 to-purple-500",
            glow: "shadow-violet-500/20",
        },
        {
            label: "With Allergies",
            value: stats?.withAllergies ?? '-',
            icon: AlertTriangle,
            color: "from-amber-500 to-orange-500",
            glow: "shadow-amber-500/20",
        },
        {
            label: "Active Rooms",
            value: stats?.totalRooms ?? '-',
            icon: ClipboardList,
            color: "from-cyan-500 to-blue-500",
            glow: "shadow-cyan-500/20",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {greeting}, {user?.firstName || 'there'}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here's what's happening at {user?.tenantName || 'your nursery'} today
                    </p>
                </div>
                <Link href="/daily-logs">
                    <Button className="btn-premium">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Quick Log Entry
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`stat-card ${stat.glow}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                {statsLoading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mt-2" />
                                ) : (
                                    <p className="text-3xl font-bold mt-1">
                                        {stat.value}
                                        {stat.total && (
                                            <span className="text-lg text-muted-foreground font-normal">
                                                /{stat.total}
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 glass rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Recent Activity</h2>
                        <Link href="/daily-logs" className="text-primary text-sm hover:underline flex items-center gap-1">
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {activityLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : recentActivity && recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((item: any, i: number) => {
                                const Icon = activityIcons[item.type] || activityIcons.default;
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + i * 0.05 }}
                                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        <div className="glass-subtle p-2 rounded-lg">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {item.child?.firstName} {item.child?.lastName}
                                                </span>
                                                {item.child?.hasAllergy && (
                                                    <span className="allergy-badge text-xs">⚠️ Allergy</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {item.type.replace('_', ' ')} - {item.notes || formatLogData(item.type, item.data)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })} by {item.author?.firstName} {item.author?.lastName}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No activity logged today yet</p>
                            <Button className="mt-4 btn-premium">Log First Entry</Button>
                        </div>
                    )}
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass rounded-xl p-6"
                >
                    <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        {[
                            { label: "Log Nappy Change", icon: Baby, href: "/daily-logs/new?type=NAPPY" },
                            { label: "Log Meal", icon: Utensils, href: "/daily-logs/new?type=MEAL" },
                            { label: "Log Sleep", icon: Moon, href: "/daily-logs/new?type=SLEEP" },
                            { label: "Take Photo", icon: Camera, href: "/daily-logs/new?type=PHOTO" },
                            { label: "Check In Child", icon: Clock, href: "/attendance" },
                        ].map((action, i) => (
                            <Link key={action.label} href={action.href}>
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + i * 0.05 }}
                                    className="flex items-center gap-3 p-3 rounded-lg glass-subtle hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                                        <action.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium">{action.label}</span>
                                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                                </motion.div>
                            </Link>
                        ))}
                    </div>

                    {/* Today's Tasks */}
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Today's Tasks</h3>
                        <div className="space-y-2">
                            {[
                                { text: "Morning register", done: true },
                                { text: "Update meal logs", done: false },
                                { text: "Parent messages", done: false },
                            ].map((task, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 p-2 rounded-lg ${task.done ? "opacity-60" : ""
                                        }`}
                                >
                                    <CheckCircle2
                                        className={`h-5 w-5 ${task.done ? "text-emerald-500" : "text-muted-foreground"
                                            }`}
                                    />
                                    <span className={task.done ? "line-through" : ""}>
                                        {task.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}


function formatLogData(type: string, data: any): string {
    if (!data) return '';

    switch (type) {
        case 'NAPPY':
            return data.result ? `${data.result}${data.cream ? ' + cream' : ''}` : '';
        case 'MEAL':
            return data.menu ? `${data.meal}: ${data.menu}` : data.meal || '';
        case 'SLEEP':
            return data.duration ? `${data.duration} mins` : 'Sleeping';
        case 'ACTIVITY':
            return data.activity || '';
        default:
            return '';
    }
}
