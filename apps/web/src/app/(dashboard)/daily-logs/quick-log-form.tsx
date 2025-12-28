"use client";

import { useState } from "react";
import {
    Baby,
    Utensils,
    Moon,
    Camera,
    Loader2,
    Check,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MultiChildSelector } from "@/components/multi-child-selector";
import { ChildCombobox } from "@/components/child-combobox";
import { useCreateDailyLog, useRecentActivity } from "@/hooks/use-daily-logs";
import { toast } from "sonner";
import { differenceInMinutes } from "date-fns";

interface QuickLogFormProps {
    initialType: string;
    preselectedChildId?: string;
    onSuccess: () => void;
}

const DUPLICATE_THRESHOLD_MINUTES = 5;

export function QuickLogForm({ initialType, preselectedChildId, onSuccess }: QuickLogFormProps) {
    const [logType, setLogType] = useState(initialType);
    const [isMultiMode, setIsMultiMode] = useState(false);
    const [childId, setChildId] = useState<string>(preselectedChildId || "");
    const [selectedChildIds, setSelectedChildIds] = useState<string[]>(
        preselectedChildId ? [preselectedChildId] : []
    );
    const [notes, setNotes] = useState("");

    // Type-specific fields
    const [nappyResult, setNappyResult] = useState("WET");
    const [nappyCream, setNappyCream] = useState(false);

    const [mealType, setMealType] = useState("LUNCH");
    const [mealMenu, setMealMenu] = useState("");
    const [mealQuantity, setMealQuantity] = useState("ALL");

    const [sleepDuration, setSleepDuration] = useState("");
    const [sleepQuality, setSleepQuality] = useState("GOOD");

    const [activityName, setActivityName] = useState("");

    const createLog = useCreateDailyLog();
    const { data: recentLogs } = useRecentActivity(100);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Duplicate warning dialog state
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [duplicateNames, setDuplicateNames] = useState<string[]>([]);
    const [pendingSubmit, setPendingSubmit] = useState<(() => Promise<void>) | null>(null);

    // Check for recent duplicate logs
    const checkForDuplicates = (childIds: string[], type: string, mealTypeValue?: string): string[] => {
        if (!recentLogs) return [];

        const now = new Date();
        const duplicates: string[] = [];

        for (const cid of childIds) {
            const recentLog = recentLogs.find((log: any) => {
                if (log.childId !== cid || log.type !== type) return false;

                const logTime = new Date(log.timestamp);
                const minutesAgo = differenceInMinutes(now, logTime);

                // For meals, also check if it's the same meal type
                if (type === "MEAL" && mealTypeValue) {
                    if (log.data?.meal !== mealTypeValue) return false;
                }

                return minutesAgo < DUPLICATE_THRESHOLD_MINUTES;
            });

            if (recentLog) {
                duplicates.push(recentLog.child?.firstName || cid);
            }
        }

        return duplicates;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const childrenToLog = isMultiMode ? selectedChildIds : (childId ? [childId] : []);

        if (childrenToLog.length === 0) {
            toast.error("Please select at least one child");
            return;
        }

        // Check for duplicates
        const duplicates = checkForDuplicates(
            childrenToLog,
            logType,
            logType === "MEAL" ? mealType : undefined
        );

        if (duplicates.length > 0) {
            // Show styled warning dialog
            setDuplicateNames(duplicates);
            setPendingSubmit(() => () => submitLogs(childrenToLog));
            setShowDuplicateWarning(true);
            return;
        }

        // No duplicates, submit directly
        await submitLogs(childrenToLog);
    };

    const submitLogs = async (childrenToLog: string[]) => {

        let data: Record<string, any> = {};

        switch (logType) {
            case "NAPPY":
                data = { result: nappyResult, cream: nappyCream };
                break;
            case "MEAL":
                data = { meal: mealType, menu: mealMenu, quantity: mealQuantity };
                break;
            case "SLEEP":
                data = { duration: parseInt(sleepDuration) || 0, quality: sleepQuality };
                break;
            case "ACTIVITY":
                data = { activity: activityName };
                break;
        }

        setIsSubmitting(true);
        let successCount = 0;
        let errorCount = 0;

        // Create logs for each selected child
        for (const cid of childrenToLog) {
            try {
                await createLog.mutateAsync({
                    childId: cid,
                    type: logType,
                    data,
                    notes: notes || undefined,
                });
                successCount++;
            } catch (error: any) {
                errorCount++;
                console.error(`Failed to create log for child ${cid}:`, error);
            }
        }

        setIsSubmitting(false);

        if (successCount > 0) {
            toast.success(
                `Created ${successCount} log${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
            );
            onSuccess();
        } else {
            toast.error("Failed to create any logs");
        }
    };

    const logTypes = [
        { value: "NAPPY", label: "Nappy", icon: Baby },
        { value: "MEAL", label: "Meal", icon: Utensils },
        { value: "SLEEP", label: "Sleep", icon: Moon },
        { value: "ACTIVITY", label: "Activity", icon: Camera },
    ];

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Log Type Selector */}
                <div className="grid grid-cols-4 gap-2">
                    {logTypes.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setLogType(value)}
                            className={`p-3 rounded-lg border text-center transition-all ${logType === value
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                                }`}
                        >
                            <Icon className={`h-5 w-5 mx-auto mb-1 ${logType === value ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-xs font-medium">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Multi-child mode toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="multi-mode" className="text-sm">Log for multiple children</Label>
                    </div>
                    <Switch
                        id="multi-mode"
                        checked={isMultiMode}
                        onCheckedChange={setIsMultiMode}
                    />
                </div>

                {/* Child Selector */}
                <div className="space-y-2">
                    <Label>
                        {isMultiMode ? "Select Children" : "Child"}
                        <span className="text-destructive"> *</span>
                    </Label>
                    {isMultiMode ? (
                        <MultiChildSelector
                            selectedIds={selectedChildIds}
                            onSelectionChange={setSelectedChildIds}
                        />
                    ) : (
                        <ChildCombobox
                            value={childId}
                            onValueChange={setChildId}
                            placeholder="Search and select a child..."
                        />
                    )}
                </div>

                {/* Type-specific fields */}
                {logType === "NAPPY" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Result</Label>
                            <RadioGroup value={nappyResult} onValueChange={setNappyResult} className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="WET" id="wet" />
                                    <Label htmlFor="wet">Wet</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="SOILED" id="soiled" />
                                    <Label htmlFor="soiled">Soiled</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="BOTH" id="both" />
                                    <Label htmlFor="both">Both</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="DRY" id="dry" />
                                    <Label htmlFor="dry">Dry</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="cream"
                                checked={nappyCream}
                                onCheckedChange={(checked: boolean) => setNappyCream(checked)}
                            />
                            <Label htmlFor="cream">Barrier cream applied</Label>
                        </div>
                    </div>
                )}

                {logType === "MEAL" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Meal</Label>
                            <Select value={mealType} onValueChange={setMealType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                                    <SelectItem value="MORNING_SNACK">Morning Snack</SelectItem>
                                    <SelectItem value="LUNCH">Lunch</SelectItem>
                                    <SelectItem value="AFTERNOON_SNACK">Afternoon Snack</SelectItem>
                                    <SelectItem value="TEA">Tea</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Menu Item</Label>
                            <Input
                                value={mealMenu}
                                onChange={(e) => setMealMenu(e.target.value)}
                                placeholder="e.g., Pasta Bolognese, Fruit yoghurt"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount Eaten</Label>
                            <RadioGroup value={mealQuantity} onValueChange={setMealQuantity} className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="ALL" id="all" />
                                    <Label htmlFor="all">All</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="MOST" id="most" />
                                    <Label htmlFor="most">Most</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="SOME" id="some" />
                                    <Label htmlFor="some">Some</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="NONE" id="none" />
                                    <Label htmlFor="none">None</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                )}

                {logType === "SLEEP" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Input
                                type="number"
                                value={sleepDuration}
                                onChange={(e) => setSleepDuration(e.target.value)}
                                placeholder="e.g., 45"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sleep Quality</Label>
                            <RadioGroup value={sleepQuality} onValueChange={setSleepQuality} className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="GOOD" id="good" />
                                    <Label htmlFor="good">Good</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="RESTLESS" id="restless" />
                                    <Label htmlFor="restless">Restless</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="POOR" id="poor" />
                                    <Label htmlFor="poor">Poor</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                )}

                {logType === "ACTIVITY" && (
                    <div className="space-y-2">
                        <Label>Activity</Label>
                        <Input
                            value={activityName}
                            onChange={(e) => setActivityName(e.target.value)}
                            placeholder="e.g., Outdoor play, Painting, Story time"
                        />
                    </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes..."
                        rows={2}
                    />
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="w-full btn-premium"
                    disabled={isSubmitting || (isMultiMode ? selectedChildIds.length === 0 : !childId)}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving {isMultiMode ? `${selectedChildIds.length} logs` : ''}...
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            {isMultiMode ? `Log for ${selectedChildIds.length} children` : 'Save Log Entry'}
                        </>
                    )}
                </Button>
            </form>

            {/* Duplicate Warning Dialog */}
            <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <span className="text-amber-500">⚠️</span>
                            Possible Duplicate Entry
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                {duplicateNames.length === 1 ? (
                                    <p>
                                        <strong>{duplicateNames[0]}</strong> already has a {logType.toLowerCase()} log in the last {DUPLICATE_THRESHOLD_MINUTES} minutes.
                                    </p>
                                ) : (
                                    <>
                                        <p>{duplicateNames.length} children already have {logType.toLowerCase()} logs in the last {DUPLICATE_THRESHOLD_MINUTES} minutes:</p>
                                        <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                                            {duplicateNames.slice(0, 5).join(", ")}
                                            {duplicateNames.length > 5 && ` and ${duplicateNames.length - 5} more`}
                                        </div>
                                    </>
                                )}
                                <p className="mt-3">Are you sure you want to create another entry?</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setShowDuplicateWarning(false);
                            setPendingSubmit(null);
                        }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                setShowDuplicateWarning(false);
                                if (pendingSubmit) {
                                    await pendingSubmit();
                                    setPendingSubmit(null);
                                }
                            }}
                            className="bg-amber-500 hover:bg-amber-600"
                        >
                            Yes, Log Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
