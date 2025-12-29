"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardCheck,
    Filter,
    Plus,
    Baby,
    Utensils,
    Moon,
    Camera,
    Loader2,
    X,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChildCombobox } from "@/components/child-combobox";
import { useChildren } from "@/hooks/use-children";
import { useRecentActivity } from "@/hooks/use-daily-logs";
import {
    format,
    isToday,
    isYesterday,
    isSameDay,
    subDays,
    addDays,
} from "date-fns";
import { QuickLogForm } from "./quick-log-form";
import { DateSidebar, LogCard, logTypeIcons, logTypeColors } from "@/features/daily-logs/components";

// Constants moved to @/features/daily-logs/components/LogCard.tsx

const ITEMS_PER_SECTION = 10;

export default function DailyLogsPage() {
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [childFilter, setChildFilter] = useState<string>("");
    const [roomFilter, setRoomFilter] = useState<string>("all");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedLogType, setSelectedLogType] = useState<string>("NAPPY");

    // Collapsible sections
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        Morning: true,
        Afternoon: true,
        Evening: true,
    });

    // Pagination per section
    const [sectionPages, setSectionPages] = useState<Record<string, number>>({
        Morning: 1,
        Afternoon: 1,
        Evening: 1,
    });

    const { data: logs, isLoading, refetch } = useRecentActivity(500);
    const { data: children } = useChildren();

    // Get unique rooms from children data
    const rooms = children
        ? [...new Set(children.map((c: any) => c.room?.name).filter(Boolean))]
        : [];

    // Filter logs by date, type, child, and room
    const filteredLogs = logs?.filter((log: any) => {
        const logDate = new Date(log.timestamp);
        if (!isSameDay(logDate, selectedDate)) return false;
        if (typeFilter !== "all" && log.type !== typeFilter) return false;
        if (childFilter && log.childId !== childFilter) return false;
        if (roomFilter !== "all") {
            const childRoom = log.child?.room?.name;
            if (childRoom !== roomFilter) return false;
        }
        return true;
    }) || [];

    // Group logs by time of day
    const groupedLogs = filteredLogs.reduce((groups: any, log: any) => {
        const hour = new Date(log.timestamp).getHours();
        const period = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
        if (!groups[period]) groups[period] = [];
        groups[period].push(log);
        return groups;
    }, {});

    const formatLogData = (type: string, data: any): string => {
        if (!data) return '';
        switch (type) {
            case 'NAPPY':
                const nappyResult = data.result?.toLowerCase() || '';
                return `${nappyResult}${data.cream ? ', cream applied' : ''}`;
            case 'MEAL':
                const quantity = data.quantity?.toLowerCase() || 'some';
                return data.menu
                    ? `${data.meal}: ${data.menu} (ate ${quantity})`
                    : `${data.meal || 'Meal'} - ate ${quantity}`;
            case 'SLEEP':
                return data.duration
                    ? `${data.duration} mins${data.quality ? ` (${data.quality.toLowerCase()})` : ''}`
                    : 'Recorded';
            case 'ACTIVITY':
                return data.activity || 'Activity recorded';
            default:
                return '';
        }
    };

    const openQuickLog = (type: string) => {
        setSelectedLogType(type);
        setIsDialogOpen(true);
    };

    const clearFilters = () => {
        setTypeFilter("all");
        setChildFilter("");
        setRoomFilter("all");
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const loadMore = (section: string) => {
        setSectionPages(prev => ({
            ...prev,
            [section]: prev[section] + 1
        }));
    };

    const hasFilters = typeFilter !== "all" || childFilter || roomFilter !== "all";

    const getDateLabel = () => {
        if (isToday(selectedDate)) return "Today";
        if (isYesterday(selectedDate)) return "Yesterday";
        return format(selectedDate, "d MMM");
    };

    const getDayName = () => {
        if (isToday(selectedDate)) return format(selectedDate, "EEEE");
        if (isYesterday(selectedDate)) return format(selectedDate, "EEEE");
        return format(selectedDate, "EEEE");
    };

    return (
        <div className="flex gap-6">
            {/* Left Sidebar - Date & Stats */}
            <DateSidebar
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                totalEntries={filteredLogs.length}
                groupedStats={Object.fromEntries(
                    Object.entries(groupedLogs).map(([period, logs]: [string, any]) => [period, logs.length])
                )}
            />

            {/* Main Content */}
            <div className="flex-1 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <ClipboardCheck className="h-8 w-8 text-primary" />
                            Daily Logs
                        </h1>
                        <p className="text-muted-foreground mt-1 lg:hidden">
                            {format(selectedDate, "EEEE, d MMMM yyyy")} • {filteredLogs.length} entries
                        </p>
                        <p className="text-muted-foreground mt-1 hidden lg:block">
                            {filteredLogs.length} entries for {getDateLabel().toLowerCase()}
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-premium">
                                <Plus className="mr-2 h-4 w-4" />
                                Quick Log
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Log Entry</DialogTitle>
                            </DialogHeader>
                            <QuickLogForm
                                initialType={selectedLogType}
                                preselectedChildId={childFilter}
                                onSuccess={() => {
                                    setIsDialogOpen(false);
                                    refetch();
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Mobile Date Navigation */}
                <div className="lg:hidden stat-card">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="min-w-[180px]">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(selectedDate, "EEE, d MMM")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            disabled={isToday(selectedDate)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { type: "NAPPY", label: "Nappy", icon: Baby, color: "from-blue-500 to-cyan-500" },
                        { type: "MEAL", label: "Meal", icon: Utensils, color: "from-green-500 to-emerald-500" },
                        { type: "SLEEP", label: "Sleep", icon: Moon, color: "from-purple-500 to-violet-500" },
                        { type: "ACTIVITY", label: "Activity", icon: Camera, color: "from-orange-500 to-amber-500" },
                    ].map((item) => (
                        <motion.button
                            key={item.type}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openQuickLog(item.type)}
                            className="stat-card hover:border-primary/30 cursor-pointer group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                                    <item.icon className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-medium text-sm">{item.label}</span>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Filters */}
                <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Filters</span>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Child</label>
                            <ChildCombobox
                                value={childFilter}
                                onValueChange={setChildFilter}
                                placeholder="All children"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Room</label>
                            <Select value={roomFilter} onValueChange={setRoomFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Rooms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Rooms</SelectItem>
                                    {rooms.map((room: string) => (
                                        <SelectItem key={room} value={room}>{room}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Type</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="NAPPY">Nappy</SelectItem>
                                    <SelectItem value="MEAL">Meal</SelectItem>
                                    <SelectItem value="SLEEP">Sleep</SelectItem>
                                    <SelectItem value="ACTIVITY">Activity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Logs Timeline */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : Object.keys(groupedLogs).length > 0 ? (
                    <div className="space-y-4">
                        {["Morning", "Afternoon", "Evening"].map(period => {
                            const periodLogs = groupedLogs[period];
                            if (!periodLogs || periodLogs.length === 0) return null;

                            const isExpanded = expandedSections[period];
                            const currentPage = sectionPages[period];
                            const displayedLogs = periodLogs.slice(0, currentPage * ITEMS_PER_SECTION);
                            const hasMore = displayedLogs.length < periodLogs.length;

                            return (
                                <div key={period} className="stat-card">
                                    {/* Section Header */}
                                    <button
                                        onClick={() => toggleSection(period)}
                                        className="w-full flex items-center justify-between p-2 -m-2 hover:bg-muted/50 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{period}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {periodLogs.length} entries
                                            </span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </button>

                                    {/* Section Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <ScrollArea className={periodLogs.length > 5 ? "h-[400px]" : ""}>
                                                    <div className="space-y-3 pt-4">
                                                        {displayedLogs.map((log: any, i: number) => (
                                                            <LogCard
                                                                key={log.id}
                                                                log={log}
                                                                index={i}
                                                                formatLogData={formatLogData}
                                                            />
                                                        ))}
                                                    </div>
                                                </ScrollArea>

                                                {/* Load More */}
                                                {hasMore && (
                                                    <div className="pt-4 text-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => loadMore(period)}
                                                        >
                                                            Load more ({periodLogs.length - displayedLogs.length} remaining)
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <ClipboardCheck className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold">No logs for {format(selectedDate, "d MMMM")}</h3>
                        <p className="text-muted-foreground mt-1">
                            {hasFilters ? "Try adjusting your filters" : isToday(selectedDate) ? "Start recording daily activities" : "No activity was recorded"}
                        </p>
                        {isToday(selectedDate) && !hasFilters && (
                            <Button className="mt-4 btn-premium" onClick={() => openQuickLog("NAPPY")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Log
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
