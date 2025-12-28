"use client";

import * as React from "react";
import { Check, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useChildren } from "@/hooks/use-children";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MultiChildSelectorProps {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    roomFilter?: string;
}

export function MultiChildSelector({ selectedIds, onSelectionChange, roomFilter }: MultiChildSelectorProps) {
    const [search, setSearch] = React.useState("");
    const { data: children, isLoading } = useChildren();

    // Filter children by search and room
    const filteredChildren = React.useMemo(() => {
        if (!children) return [];
        return children.filter((child: any) => {
            const matchesSearch = !search ||
                `${child.firstName} ${child.lastName}`.toLowerCase().includes(search.toLowerCase());
            const matchesRoom = !roomFilter || roomFilter === "all" ||
                child.room?.name === roomFilter;
            return matchesSearch && matchesRoom;
        });
    }, [children, search, roomFilter]);

    const toggleChild = (childId: string) => {
        if (selectedIds.includes(childId)) {
            onSelectionChange(selectedIds.filter(id => id !== childId));
        } else {
            onSelectionChange([...selectedIds, childId]);
        }
    };

    const selectAll = () => {
        const allIds = filteredChildren.map((c: any) => c.id);
        onSelectionChange(allIds);
    };

    const clearAll = () => {
        onSelectionChange([]);
    };

    // Group children by room
    const groupedByRoom = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        filteredChildren.forEach((child: any) => {
            const roomName = child.room?.name || 'Unassigned';
            if (!groups[roomName]) groups[roomName] = [];
            groups[roomName].push(child);
        });
        return groups;
    }, [filteredChildren]);

    return (
        <div className="space-y-4">
            {/* Search and actions */}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Search children..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                    All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAll}>
                    Clear
                </Button>
            </div>

            {/* Selection summary */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedIds.slice(0, 5).map(id => {
                        const child = children?.find((c: any) => c.id === id);
                        if (!child) return null;
                        return (
                            <Badge key={id} variant="secondary" className="gap-1">
                                {child.firstName}
                                {child.hasAllergy && <AlertTriangle className="h-3 w-3 text-destructive" />}
                                <button
                                    type="button"
                                    onClick={() => toggleChild(id)}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        );
                    })}
                    {selectedIds.length > 5 && (
                        <Badge variant="secondary">+{selectedIds.length - 5} more</Badge>
                    )}
                </div>
            )}

            {/* Children list grouped by room */}
            <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-2 space-y-4">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground p-4">Loading...</div>
                    ) : Object.entries(groupedByRoom).length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">No children found</div>
                    ) : (
                        Object.entries(groupedByRoom).map(([roomName, roomChildren]) => (
                            <div key={roomName}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">{roomName}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        ({roomChildren.filter((c: any) => selectedIds.includes(c.id)).length}/{roomChildren.length})
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {roomChildren.map((child: any) => (
                                        <label
                                            key={child.id}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                                selectedIds.includes(child.id)
                                                    ? "bg-primary/10 border border-primary/30"
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <Checkbox
                                                checked={selectedIds.includes(child.id)}
                                                onCheckedChange={() => toggleChild(child.id)}
                                            />
                                            <span className="font-medium flex-1">
                                                {child.firstName} {child.lastName}
                                            </span>
                                            {child.hasAllergy && (
                                                <Badge variant="destructive" className="text-xs px-1.5">
                                                    <AlertTriangle className="h-3 w-3" />
                                                </Badge>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
                {selectedIds.length} child{selectedIds.length !== 1 ? 'ren' : ''} selected
            </p>
        </div>
    );
}
