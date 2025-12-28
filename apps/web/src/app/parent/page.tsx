"use client";

import { useState } from "react";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Utensils,
    Moon,
    Baby,
    Camera,
    MessageCircle,
    Activity,
    Clock,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSelectedChild } from "./layout";
import { useChildTimeline, useChildProfile } from "@/hooks/use-parent";

// Log type icons and colors
const logTypeConfig: Record<string, { icon: typeof Utensils; color: string; label: string }> = {
    MEAL: { icon: Utensils, color: "text-orange-500 bg-orange-500/10", label: "Meal" },
    SLEEP: { icon: Moon, color: "text-indigo-500 bg-indigo-500/10", label: "Sleep" },
    NAPPY: { icon: Baby, color: "text-cyan-500 bg-cyan-500/10", label: "Nappy" },
    ACTIVITY: { icon: Activity, color: "text-green-500 bg-green-500/10", label: "Activity" },
    PHOTO: { icon: Camera, color: "text-pink-500 bg-pink-500/10", label: "Photo" },
    NOTE: { icon: MessageCircle, color: "text-blue-500 bg-blue-500/10", label: "Note" },
};

function formatLogContent(type: string, data: any, notes: string | null): string {
    switch (type) {
        case "MEAL":
            return `${data.meal}: ${data.menu} — ${data.quantity === "ALL" ? "Ate it all! 🎉" : data.quantity === "MOST" ? "Ate most" : data.quantity === "SOME" ? "Ate some" : "Wasn't hungry"}`;
        case "SLEEP":
            return `Slept from ${data.startTime || "?"} to ${data.endTime || "?"}`;
        case "NAPPY":
            return `${data.result}${data.cream ? " — Cream applied" : ""}`;
        case "ACTIVITY":
            return data.activity || notes || "Activity time";
        case "NOTE":
            return notes || data.content || "";
        default:
            return notes || JSON.stringify(data);
    }
}

export default function ParentTimelinePage() {
    const { selectedChildId, children } = useSelectedChild();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const { data: timeline, isLoading, isFetching, refetch } = useChildTimeline(
        selectedChildId || "",
        selectedDate
    );
    const { data: childProfile } = useChildProfile(selectedChildId || "");

    const selectedChild = children.find((c) => c.id === selectedChildId);

    const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
    const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
    const goToToday = () => setSelectedDate(new Date());

    if (!selectedChildId) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <p className="text-muted-foreground">No children linked to your account</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedChild?.profilePhotoUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {selectedChild?.firstName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-bold">
                            {selectedChild?.firstName}'s Day
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {childProfile?.room?.name} • Key Person: {childProfile?.keyPerson?.firstName}
                        </p>
                    </div>
                </div>

                {/* Allergy Alert */}
                {childProfile?.hasAllergy && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-red-600">
                            ⚠️ Allergy Alert: {childProfile.allergies?.map((a: any) => a.name).join(", ")}
                        </p>
                    </div>
                )}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between bg-card rounded-xl p-3 mb-6 border">
                <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <button
                    onClick={goToToday}
                    className="text-center hover:bg-muted rounded-lg px-4 py-1 transition-colors"
                >
                    <div className="font-semibold">
                        {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {format(selectedDate, "d MMMM yyyy")}
                    </div>
                </button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextDay}
                    disabled={isToday(selectedDate)}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Timeline */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-1/3" />
                                    <div className="h-3 bg-muted rounded w-2/3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : timeline && timeline.length > 0 ? (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {timeline.map((entry, index) => {
                            const config = logTypeConfig[entry.type] || logTypeConfig.NOTE;
                            const Icon = config.icon;

                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="overflow-hidden">
                                        <CardContent className="p-4">
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.color}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {config.label}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(parseISO(entry.timestamp), "h:mm a")}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">
                                                        {formatLogContent(entry.type, entry.data, entry.notes)}
                                                    </p>
                                                    {entry.notes && entry.type !== "NOTE" && entry.type !== "ACTIVITY" && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {entry.notes}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        By {entry.author.firstName} {entry.author.lastName}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Media */}
                                            {entry.mediaUrls && entry.mediaUrls.length > 0 && (
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    {entry.mediaUrls.map((url, i) => (
                                                        <img
                                                            key={i}
                                                            src={url}
                                                            alt="Activity"
                                                            className="rounded-lg object-cover aspect-video"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-1">No updates yet</h3>
                        <p className="text-sm text-muted-foreground">
                            {isToday(selectedDate)
                                ? "Check back later for updates on your child's day"
                                : "No activities were recorded on this day"}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
