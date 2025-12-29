'use client';

import { motion } from 'framer-motion';
import { LogIn, LogOut, AlertTriangle, Undo2, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

export const statusColors: Record<string, string> = {
    EXPECTED: 'bg-amber-500/10 text-amber-600 border-amber-300',
    CHECKED_IN: 'bg-green-500/10 text-green-600 border-green-300',
    CHECKED_OUT: 'bg-blue-500/10 text-blue-600 border-blue-300',
    ABSENT_NOTIFIED: 'bg-gray-500/10 text-gray-600 border-gray-300',
    ABSENT_UNNOTIFIED: 'bg-red-500/10 text-red-600 border-red-300',
};

export const statusLabels: Record<string, string> = {
    EXPECTED: 'Expected',
    CHECKED_IN: 'Present',
    CHECKED_OUT: 'Departed',
    ABSENT_NOTIFIED: 'Absent',
    ABSENT_UNNOTIFIED: 'Absent (No Notice)',
};

export interface Child {
    id: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
    hasAllergy?: boolean;
    room?: { name: string };
    attendance?: {
        status: string;
        checkInTime?: string;
        checkOutTime?: string;
        collectedBy?: string;
    };
}

export interface AttendanceCardProps {
    child: Child;
    index: number;
    isSelected: boolean;
    onToggleSelect: (childId: string) => void;
    onCheckIn: (childId: string) => void;
    onCheckOut: (childId: string, childName: string) => void;
    onMarkAbsent: (childId: string) => void;
    onUndoCheckIn: (childId: string) => void;
    onUndoCheckOut: (childId: string) => void;
    onUndoAbsence: (childId: string) => void;
    isPending: {
        checkIn: boolean;
        checkOut: boolean;
        markAbsent: boolean;
        undoCheckIn: boolean;
        undoCheckOut: boolean;
        undoAbsence: boolean;
    };
}

export function AttendanceCard({
    child,
    index,
    isSelected,
    onToggleSelect,
    onCheckIn,
    onCheckOut,
    onMarkAbsent,
    onUndoCheckIn,
    onUndoCheckOut,
    onUndoAbsence,
    isPending,
}: AttendanceCardProps) {
    const status = child.attendance?.status || 'EXPECTED';
    const canCheckIn = status === 'EXPECTED';
    const canCheckOut = status === 'CHECKED_IN';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            className={`stat-card cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
        >
            <div className="flex items-start gap-3">
                {/* Selection Checkbox */}
                {canCheckIn && (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(child.id)}
                        className="mt-1"
                    />
                )}

                {/* Avatar */}
                <div className="relative shrink-0">
                    {child.profilePhotoUrl ? (
                        <img
                            src={child.profilePhotoUrl}
                            alt={child.firstName}
                            className="w-14 h-14 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                            {child.firstName[0]}
                            {child.lastName[0]}
                        </div>
                    )}
                    {child.hasAllergy && (
                        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                            <AlertTriangle className="h-3 w-3" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                        {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{child.room?.name}</p>
                    <Badge variant="outline" className={`mt-1 ${statusColors[status]}`}>
                        {statusLabels[status]}
                    </Badge>

                    {/* Time info */}
                    {child.attendance?.checkInTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                            In: {format(new Date(child.attendance.checkInTime), 'HH:mm')}
                            {child.attendance.checkOutTime && (
                                <> • Out: {format(new Date(child.attendance.checkOutTime), 'HH:mm')}</>
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
                {canCheckIn && (
                    <>
                        <Button
                            size="sm"
                            className="flex-1 btn-premium"
                            onClick={() => onCheckIn(child.id)}
                            disabled={isPending.checkIn}
                        >
                            <LogIn className="h-4 w-4 mr-1" />
                            Check In
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onMarkAbsent(child.id)}
                            disabled={isPending.markAbsent}
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </>
                )}

                {status === 'CHECKED_IN' && (
                    <div className="flex gap-2 w-full">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-dashed text-muted-foreground hover:text-foreground"
                            onClick={() => onUndoCheckIn(child.id)}
                            disabled={isPending.undoCheckIn}
                        >
                            <Undo2 className="h-4 w-4 mr-1" />
                            Undo
                        </Button>
                        {canCheckOut && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="flex-[2]"
                                onClick={() => onCheckOut(child.id, `${child.firstName} ${child.lastName}`)}
                                disabled={isPending.checkOut}
                            >
                                <LogOut className="h-4 w-4 mr-1" />
                                Check Out
                            </Button>
                        )}
                    </div>
                )}

                {(status === 'ABSENT_NOTIFIED' || status === 'ABSENT_UNNOTIFIED') && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-dashed text-muted-foreground hover:text-foreground"
                        onClick={() => onUndoAbsence(child.id)}
                        disabled={isPending.undoAbsence}
                    >
                        <Undo2 className="h-4 w-4 mr-1" />
                        Undo Absence
                    </Button>
                )}

                {status === 'CHECKED_OUT' && (
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Collected by {child.attendance?.collectedBy || '—'}</span>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="w-full text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => onUndoCheckOut(child.id)}
                            disabled={isPending.undoCheckOut}
                        >
                            <Undo2 className="h-3 w-3 mr-1" />
                            Mistake? Undo Check Out
                        </Button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
