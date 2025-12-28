"use client";

import { use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft,
    Baby,
    Calendar,
    Phone,
    Mail,
    MapPin,
    AlertTriangle,
    Users,
    Utensils,
    ClipboardList,
    Edit,
    Loader2,
    Shield,
    Clock,
    Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChild } from "@/hooks/use-children";
import { useDailyLogs } from "@/hooks/use-daily-logs";

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: child, isLoading } = useChild(id);
    const { data: recentLogs } = useDailyLogs({ childId: id, limit: 5 });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!child) {
        return (
            <div className="text-center py-20">
                <Baby className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Child not found</h3>
                <Link href="/children">
                    <Button className="mt-4" variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Children
                    </Button>
                </Link>
            </div>
        );
    }

    const getAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
            (today.getMonth() - birthDate.getMonth());
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years === 0) return `${months} months`;
        return remainingMonths > 0 ? `${years} years, ${remainingMonths} months` : `${years} years`;
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    const formatLogData = (type: string, data: any): string => {
        if (!data) return '';
        switch (type) {
            case 'NAPPY':
                const nappyResult = data.result?.toLowerCase() || '';
                return `Nappy: ${nappyResult}${data.cream ? ', cream applied' : ''}`;
            case 'MEAL':
                const quantity = data.quantity?.toLowerCase() || 'some';
                return data.menu
                    ? `${data.meal}: ${data.menu} (ate ${quantity})`
                    : `${data.meal || 'Meal'} - ate ${quantity}`;
            case 'SLEEP':
                return data.duration
                    ? `Slept for ${data.duration} minutes${data.quality ? ` (${data.quality.toLowerCase()})` : ''}`
                    : 'Sleep recorded';
            case 'ACTIVITY':
                return data.activity || 'Activity recorded';
            default:
                return Object.entries(data)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/children">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Child Profile</h1>
                </div>
                <Button className="btn-premium">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2"
                >
                    <div className="stat-card">
                        <div className="flex items-start gap-6">
                            <Avatar className="h-24 w-24 border-4 border-primary/20">
                                <AvatarImage src={child.profilePhotoUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                    {getInitials(child.firstName, child.lastName)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold">{child.firstName} {child.lastName}</h2>
                                    {child.hasAllergy && (
                                        <span className="allergy-badge">⚠️ Allergies</span>
                                    )}
                                    <Badge variant={child.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                        {child.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{getAge(child.dateOfBirth)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Baby className="h-4 w-4" />
                                        <span>{child.gender}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{child.room?.name || 'Unassigned'}</span>
                                    </div>
                                    {child.keyPerson && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>Key: {child.keyPerson.user?.firstName} {child.keyPerson.user?.lastName}</span>
                                        </div>
                                    )}
                                </div>

                                {child.aboutMe && (
                                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                                        <p className="text-sm italic">&quot;{child.aboutMe}&quot;</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Allergy Warning */}
                        {child.hasAllergy && child.allergies && child.allergies.length > 0 && (
                            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-destructive">Allergy Information</h4>
                                        <div className="mt-2 space-y-2">
                                            {child.allergies.map((allergy: any, i: number) => (
                                                <div key={i} className="text-sm">
                                                    <span className="font-medium">{allergy.name}</span>
                                                    <span className="text-muted-foreground"> ({allergy.severity})</span>
                                                    {allergy.action && (
                                                        <p className="text-muted-foreground mt-1">Action: {allergy.action}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dietary Requirements */}
                        {child.dietaryRequirements && child.dietaryRequirements.length > 0 && (
                            <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
                                <div className="flex items-start gap-3">
                                    <Utensils className="h-5 w-5 text-warning shrink-0" />
                                    <div>
                                        <h4 className="font-semibold">Dietary Requirements</h4>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {child.dietaryRequirements.map((diet: string, i: number) => (
                                                <Badge key={i} variant="outline">{diet.replace('_', ' ')}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Attendance Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="stat-card"
                    >
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <Clock className="h-5 w-5 text-primary" />
                            Schedule
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Expected Days</span>
                                <span>{child.expectedDays?.join(', ') || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Hours/Week</span>
                                <span>{child.expectedHoursPerWeek || 0}h</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Funding</span>
                                <Badge variant="secondary">{child.fundingType?.replace('_', ' ') || 'None'}</Badge>
                            </div>
                            {child.fundingHours && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Funded Hours</span>
                                    <span>{child.fundingHours}h</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Guardians */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="stat-card"
                    >
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <Heart className="h-5 w-5 text-primary" />
                            Guardians
                        </h3>
                        <div className="space-y-4">
                            {child.guardians?.map((cg: any, i: number) => (
                                <div key={i} className="p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                            {cg.guardian?.title} {cg.guardian?.firstName} {cg.guardian?.lastName}
                                        </span>
                                        {cg.isPrimary && <Badge>Primary</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{cg.guardian?.relationship}</p>
                                    <div className="mt-2 space-y-1 text-sm">
                                        {cg.guardian?.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                {cg.guardian.phone}
                                            </div>
                                        )}
                                        {cg.guardian?.email && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                {cg.guardian.email}
                                            </div>
                                        )}
                                    </div>
                                    {cg.authorizedToCollect && (
                                        <Badge variant="outline" className="mt-2 text-xs">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Authorized to Collect
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Emergency Contacts */}
                    {child.contacts && child.contacts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="stat-card"
                        >
                            <h3 className="font-semibold flex items-center gap-2 mb-4">
                                <Phone className="h-5 w-5 text-destructive" />
                                Emergency Contacts
                            </h3>
                            <div className="space-y-3">
                                {child.contacts.map((contact: any, i: number) => (
                                    <div key={i} className="p-3 rounded-lg bg-muted/30">
                                        <div className="font-medium">{contact.name}</div>
                                        <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                            <Phone className="h-3 w-3" />
                                            {contact.phone}
                                        </div>
                                        {contact.authorizedToCollect && (
                                            <Badge variant="outline" className="mt-2 text-xs">
                                                <Shield className="h-3 w-3 mr-1" />
                                                Can Collect
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="stat-card"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Recent Activity
                    </h3>
                    <Link href={`/daily-logs?childId=${id}`}>
                        <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                </div>

                {recentLogs && recentLogs.length > 0 ? (
                    <div className="space-y-3">
                        {recentLogs.map((log: any, i: number) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                <Badge variant="secondary">{log.type}</Badge>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        {log.notes || formatLogData(log.type, log.data)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(log.timestamp).toLocaleString('en-GB')} by {log.author?.firstName}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No recent activity</p>
                )}
            </motion.div>
        </div>
    );
}
