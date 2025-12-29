'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, isToday, isYesterday, subDays, addDays } from 'date-fns';

export interface DateSidebarProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    totalEntries: number;
    groupedStats: Record<string, number>;
}

export function DateSidebar({
    selectedDate,
    onDateChange,
    totalEntries,
    groupedStats,
}: DateSidebarProps) {
    const getDayName = () => format(selectedDate, 'EEEE');

    return (
        <div className="hidden lg:block w-64 shrink-0">
            <div className="stat-card sticky top-6">
                {/* Full Date Display */}
                <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-primary">
                        {format(selectedDate, 'd')}
                    </div>
                    <div className="text-lg font-medium mt-1">
                        {format(selectedDate, 'MMMM yyyy')}
                    </div>
                    <div className="text-muted-foreground">
                        {getDayName()}
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDateChange(subDays(selectedDate, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && onDateChange(date)}
                                disabled={(date) => date > new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDateChange(addDays(selectedDate, 1))}
                        disabled={isToday(selectedDate)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Quick date buttons */}
                <div className="space-y-2">
                    <Button
                        variant={isToday(selectedDate) ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onDateChange(new Date())}
                    >
                        Today
                    </Button>
                    <Button
                        variant={isYesterday(selectedDate) ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onDateChange(subDays(new Date(), 1))}
                    >
                        Yesterday
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onDateChange(subDays(new Date(), 7))}
                    >
                        Last Week
                    </Button>
                </div>

                {/* Stats */}
                <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total entries</span>
                        <span className="font-medium">{totalEntries}</span>
                    </div>
                    {Object.entries(groupedStats).map(([period, count]) => (
                        <div key={period} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{period}</span>
                            <span>{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
