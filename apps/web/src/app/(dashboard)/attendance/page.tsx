"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    LogIn,
    LogOut,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Check,
    Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    DialogFooter,
} from "@/components/ui/dialog";
import {
    useTodaysAttendance,
    useAttendanceStats,
    useCheckIn,
    useCheckOut,
    useBulkCheckIn,
    useMarkAbsent,
    useUndoCheckIn,
    useUndoCheckOut,
    useUndoAbsence,
} from "@/hooks/use-attendance";
import { useRooms } from "@/hooks/use-children";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
    EXPECTED: "bg-amber-500/10 text-amber-600 border-amber-300",
    CHECKED_IN: "bg-green-500/10 text-green-600 border-green-300",
    CHECKED_OUT: "bg-blue-500/10 text-blue-600 border-blue-300",
    ABSENT_NOTIFIED: "bg-gray-500/10 text-gray-600 border-gray-300",
    ABSENT_UNNOTIFIED: "bg-red-500/10 text-red-600 border-red-300",
};

const statusLabels: Record<string, string> = {
    EXPECTED: "Expected",
    CHECKED_IN: "Present",
    CHECKED_OUT: "Departed",
    ABSENT_NOTIFIED: "Absent",
    ABSENT_UNNOTIFIED: "Absent (No Notice)",
};

export default function AttendancePage() {
    const [selectedRoom, setSelectedRoom] = useState<string>("all");
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [checkOutModal, setCheckOutModal] = useState<{
        open: boolean;
        childId: string;
        childName: string;
    }>({ open: false, childId: "", childName: "" });
    const [collectedBy, setCollectedBy] = useState("");
    const [collectorRelationship, setCollectorRelationship] = useState("Parent");

    const roomId = selectedRoom === "all" ? undefined : selectedRoom;
    const { data: attendance, isLoading } = useTodaysAttendance(roomId);
    const { data: stats } = useAttendanceStats(roomId);
    const { data: rooms } = useRooms();

    const checkIn = useCheckIn();
    const checkOut = useCheckOut();
    const bulkCheckIn = useBulkCheckIn();
    const markAbsent = useMarkAbsent();
    const undoCheckIn = useUndoCheckIn();
    const undoCheckOut = useUndoCheckOut();
    const undoAbsence = useUndoAbsence();

    // Show all children from the API response
    // The backend already filters by active status and room

    const handleCheckIn = async (childId: string) => {
        try {
            await checkIn.mutateAsync(childId);
            toast.success("Checked in successfully");
        } catch (error) {
            toast.error("Failed to check in");
        }
    };

    const openCheckOutModal = (childId: string, childName: string) => {
        setCheckOutModal({ open: true, childId, childName });
        setCollectedBy("");
        setCollectorRelationship("Parent");
    };

    const handleCheckOut = async () => {
        try {
            await checkOut.mutateAsync({
                childId: checkOutModal.childId,
                collectedBy: collectedBy || undefined,
                collectorRelationship,
            });
            setCheckOutModal({ open: false, childId: "", childName: "" });
            toast.success("Checked out successfully");
        } catch (error) {
            toast.error("Failed to check out");
        }
    };

    const handleBulkCheckIn = async () => {
        if (selectedChildren.length === 0) {
            toast.error("No children selected");
            return;
        }
        try {
            await bulkCheckIn.mutateAsync(selectedChildren);
            setSelectedChildren([]);
            toast.success(`Checked in ${selectedChildren.length} children`);
        } catch (error) {
            toast.error("Failed to bulk check in");
        }
    };

    const handleMarkAbsent = async (childId: string) => {
        try {
            await markAbsent.mutateAsync({ childId, notified: true });
            toast.success("Marked as absent");
        } catch (error) {
            toast.error("Failed to mark absent");
        }
    };

    const handleUndoCheckIn = async (childId: string) => {
        try {
            await undoCheckIn.mutateAsync(childId);
            toast.success("Check-in undone");
        } catch (error) {
            toast.error("Failed to undo check-in");
        }
    };

    const handleUndoCheckOut = async (childId: string) => {
        try {
            await undoCheckOut.mutateAsync(childId);
            toast.success("Check-out undone");
        } catch (error) {
            toast.error("Failed to undo check-out");
        }
    };

    const handleUndoAbsence = async (childId: string) => {
        try {
            await undoAbsence.mutateAsync(childId);
            toast.success("Absence undone");
        } catch (error) {
            toast.error("Failed to undo absence");
        }
    };

    const toggleChild = (childId: string) => {
        setSelectedChildren((prev) =>
            prev.includes(childId)
                ? prev.filter((id) => id !== childId)
                : [...prev, childId]
        );
    };

    const selectAllExpected = () => {
        const expected = attendance
            ?.filter((c: any) => !c.attendance || c.attendance.status === "EXPECTED")
            .map((c: any) => c.id) || [];
        setSelectedChildren(expected);
    };

    const clearSelection = () => {
        setSelectedChildren([]);
    };

    const getStatus = (child: any) => {
        return child.attendance?.status || "EXPECTED";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        Attendance Register
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {format(new Date(), "EEEE, d MMMM yyyy")}
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                            <UserCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats?.present || 0}</p>
                            <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats?.expected || 0}</p>
                            <p className="text-xs text-muted-foreground">Expected</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                            <LogOut className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats?.departed || 0}</p>
                            <p className="text-xs text-muted-foreground">Departed</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-slate-500">
                            <UserX className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats?.absent || 0}</p>
                            <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={selectedRoom === "all" ? "default" : "outline"}
                    onClick={() => setSelectedRoom("all")}
                >
                    All Rooms
                </Button>
                {rooms?.map((room: any) => (
                    <Button
                        key={room.id}
                        variant={selectedRoom === room.id ? "default" : "outline"}
                        onClick={() => setSelectedRoom(room.id)}
                        style={{
                            borderColor: selectedRoom === room.id ? undefined : room.color,
                        }}
                    >
                        {room.name}
                    </Button>
                ))}
            </div>

            {/* Bulk Actions Toolbar */}
            <AnimatePresence>
                {selectedChildren.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="stat-card border-primary/50 bg-primary/5"
                    >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <span className="font-medium">
                                {selectedChildren.length} child{selectedChildren.length !== 1 ? "ren" : ""} selected
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={clearSelection}>
                                    Clear
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleBulkCheckIn}
                                    disabled={bulkCheckIn.isPending}
                                    className="btn-premium"
                                >
                                    {bulkCheckIn.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <LogIn className="h-4 w-4 mr-2" />
                                    )}
                                    Check In Selected
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Select */}
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllExpected}>
                    Select All Expected
                </Button>
            </div>

            {/* Children Grid - Tablet Optimized */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {attendance?.map((child: any, i: number) => {
                        const status = getStatus(child);
                        const isSelected = selectedChildren.includes(child.id);
                        const canCheckIn = status === "EXPECTED";
                        const canCheckOut = status === "CHECKED_IN";

                        return (
                            <motion.div
                                key={child.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className={`stat-card cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : ""
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Selection Checkbox */}
                                    {canCheckIn && (
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleChild(child.id)}
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
                                        <p className="text-xs text-muted-foreground">
                                            {child.room?.name}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className={`mt-1 ${statusColors[status]}`}
                                        >
                                            {statusLabels[status]}
                                        </Badge>

                                        {/* Time info */}
                                        {child.attendance?.checkInTime && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                In: {format(new Date(child.attendance.checkInTime), "HH:mm")}
                                                {child.attendance.checkOutTime && (
                                                    <> • Out: {format(new Date(child.attendance.checkOutTime), "HH:mm")}</>
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
                                                onClick={() => handleCheckIn(child.id)}
                                                disabled={checkIn.isPending}
                                            >
                                                <LogIn className="h-4 w-4 mr-1" />
                                                Check In
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleMarkAbsent(child.id)}
                                                disabled={markAbsent.isPending}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}

                                    {status === "CHECKED_IN" && (
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 border-dashed text-muted-foreground hover:text-foreground"
                                                onClick={() => handleUndoCheckIn(child.id)}
                                                disabled={undoCheckIn.isPending}
                                            >
                                                <Undo2 className="h-4 w-4 mr-1" />
                                                Undo
                                            </Button>
                                            {canCheckOut && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="flex-[2]"
                                                    onClick={() =>
                                                        openCheckOutModal(child.id, `${child.firstName} ${child.lastName}`)
                                                    }
                                                    disabled={checkOut.isPending}
                                                >
                                                    <LogOut className="h-4 w-4 mr-1" />
                                                    Check Out
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {(status === "ABSENT_NOTIFIED" || status === "ABSENT_UNNOTIFIED") && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-dashed text-muted-foreground hover:text-foreground"
                                            onClick={() => handleUndoAbsence(child.id)}
                                            disabled={undoAbsence.isPending}
                                        >
                                            <Undo2 className="h-4 w-4 mr-1" />
                                            Undo Absence
                                        </Button>
                                    )}

                                    {status === "CHECKED_OUT" && (
                                        <div className="flex flex-col gap-2 w-full">
                                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                <span>
                                                    Collected by {child.attendance?.collectedBy || "—"}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="w-full text-xs text-muted-foreground hover:text-destructive"
                                                onClick={() => handleUndoCheckOut(child.id)}
                                                disabled={undoCheckOut.isPending}
                                            >
                                                <Undo2 className="h-3 w-3 mr-1" />
                                                Mistake? Undo Check Out
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Check Out Modal */}
            <Dialog
                open={checkOutModal.open}
                onOpenChange={(open) =>
                    setCheckOutModal({ ...checkOutModal, open })
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Check Out: {checkOutModal.childName}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Collected by (optional)</Label>
                            <Input
                                value={collectedBy}
                                onChange={(e) => setCollectedBy(e.target.value)}
                                placeholder="Name of person collecting"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Relationship</Label>
                            <Select
                                value={collectorRelationship}
                                onValueChange={setCollectorRelationship}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Parent">Parent</SelectItem>
                                    <SelectItem value="Guardian">Guardian</SelectItem>
                                    <SelectItem value="Grandparent">Grandparent</SelectItem>
                                    <SelectItem value="Emergency Contact">Emergency Contact</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setCheckOutModal({ open: false, childId: "", childName: "" })
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCheckOut}
                            disabled={checkOut.isPending}
                            className="btn-premium"
                        >
                            {checkOut.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Check className="h-4 w-4 mr-2" />
                            )}
                            Confirm Check Out
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
