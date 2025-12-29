"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    LogIn,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Check, Loader2 as Spinner } from "lucide-react";
import { AttendanceCard, AttendanceStatsBar } from "@/features/attendance/components";

// Status constants moved to @/features/attendance/components/AttendanceCard.tsx

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
            <AttendanceStatsBar stats={stats} />

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
                    {attendance?.map((child: any, i: number) => (
                        <AttendanceCard
                            key={child.id}
                            child={child}
                            index={i}
                            isSelected={selectedChildren.includes(child.id)}
                            onToggleSelect={toggleChild}
                            onCheckIn={handleCheckIn}
                            onCheckOut={openCheckOutModal}
                            onMarkAbsent={handleMarkAbsent}
                            onUndoCheckIn={handleUndoCheckIn}
                            onUndoCheckOut={handleUndoCheckOut}
                            onUndoAbsence={handleUndoAbsence}
                            isPending={{
                                checkIn: checkIn.isPending,
                                checkOut: checkOut.isPending,
                                markAbsent: markAbsent.isPending,
                                undoCheckIn: undoCheckIn.isPending,
                                undoCheckOut: undoCheckOut.isPending,
                                undoAbsence: undoAbsence.isPending,
                            }}
                        />
                    ))}
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
