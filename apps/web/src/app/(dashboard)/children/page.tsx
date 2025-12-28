"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Baby,
    Search,
    Filter,
    Plus,
    AlertTriangle,
    ChevronRight,
    Users,
    Loader2,
    Phone,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChildren, useChildStats } from "@/hooks/use-children";

export default function ChildrenPage() {
    const [search, setSearch] = useState("");
    const [roomFilter, setRoomFilter] = useState<string>("all");

    const { data: children, isLoading } = useChildren({
        search: search || undefined,
        roomId: roomFilter !== "all" ? roomFilter : undefined
    });
    const { data: stats } = useChildStats();

    // Get unique rooms from children data
    const rooms = children
        ? [...new Set(children.map((c: any) => c.room?.name).filter(Boolean))]
        : [];

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    const getAgeDisplay = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
            (today.getMonth() - birthDate.getMonth());
        if (months < 12) return `${months}m`;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Baby className="h-8 w-8 text-primary" />
                        Children
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {stats?.totalChildren || 0} registered • {stats?.presentToday || 0} present today
                    </p>
                </div>
                <Button className="btn-premium" disabled title="Child onboarding wizard coming soon">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Child
                    <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 input-premium"
                    />
                </div>
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <Filter className="mr-2 h-4 w-4" />
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

            {/* Children Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : children && children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child: any, i: number) => (
                        <motion.div
                            key={child.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link href={`/children/${child.id}`}>
                                <div className="stat-card hover:border-primary/30 cursor-pointer group">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-14 w-14 border-2 border-border">
                                            <AvatarImage src={child.profilePhotoUrl} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                {getInitials(child.firstName, child.lastName)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold truncate">
                                                    {child.firstName} {child.lastName}
                                                </h3>
                                                {child.hasAllergy && (
                                                    <span className="allergy-badge text-xs px-2 py-0.5">
                                                        ⚠️
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <span>{getAgeDisplay(child.dateOfBirth)}</span>
                                                <span>•</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {child.room?.name || 'Unassigned'}
                                                </Badge>
                                            </div>

                                            {child.keyPerson && (
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    Key: {child.keyPerson.user?.firstName} {child.keyPerson.user?.lastName}
                                                </p>
                                            )}
                                        </div>

                                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Allergy Warning */}
                                    {child.hasAllergy && child.allergies && (
                                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                                <div className="text-sm">
                                                    <p className="font-medium text-destructive">Allergies:</p>
                                                    <p className="text-muted-foreground">
                                                        {child.allergies.map((a: any) => a.name).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <Baby className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold">No children found</h3>
                    <p className="text-muted-foreground mt-1">
                        {search ? "Try adjusting your search" : "Add your first child to get started"}
                    </p>
                    <Button className="mt-4 btn-premium" disabled title="Coming soon">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Child
                        <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                    </Button>
                </div>
            )}
        </div>
    );
}
