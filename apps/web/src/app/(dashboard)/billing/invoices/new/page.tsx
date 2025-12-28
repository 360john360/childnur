"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    User,
    Baby,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCreateInvoice, formatPence } from "@/hooks/use-billing";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

interface Guardian {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPricePence: number;
    itemType: string;
}

const ITEM_TYPES = [
    { value: "SESSION_FEE", label: "Session Fee" },
    { value: "ADDITIONAL_HOURS", label: "Additional Hours" },
    { value: "MEALS", label: "Meals" },
    { value: "CONSUMABLES", label: "Consumables" },
    { value: "LATE_PICKUP_FEE", label: "Late Pickup Fee" },
    { value: "DEPOSIT", label: "Deposit" },
    { value: "REGISTRATION_FEE", label: "Registration Fee" },
    { value: "FUNDING_REDUCTION", label: "Funding Reduction" },
    { value: "DISCOUNT", label: "Discount" },
    { value: "OTHER", label: "Other" },
];

export default function CreateInvoicePage() {
    const router = useRouter();
    const createInvoice = useCreateInvoice();

    // Form state
    const [guardianId, setGuardianId] = useState("");
    const [issueDate, setIssueDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [dueDate, setDueDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split("T")[0];
    });
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<LineItem[]>([
        {
            id: crypto.randomUUID(),
            description: "",
            quantity: 1,
            unitPricePence: 0,
            itemType: "SESSION_FEE",
        },
    ]);

    // Fetch guardians
    const { data: guardians } = useQuery<Guardian[]>({
        queryKey: ["guardians"],
        queryFn: async () => {
            // Try to get guardians who are bill payers
            const { data } = await apiClient.get<Guardian[]>("/children/guardians");
            return data;
        },
    });

    // Calculate totals
    const subtotal = items.reduce((acc, item) => {
        if (item.itemType === "FUNDING_REDUCTION" || item.itemType === "DISCOUNT") {
            return acc;
        }
        return acc + item.quantity * item.unitPricePence;
    }, 0);

    const deductions = items.reduce((acc, item) => {
        if (item.itemType === "FUNDING_REDUCTION" || item.itemType === "DISCOUNT") {
            return acc + Math.abs(item.quantity * item.unitPricePence);
        }
        return acc;
    }, 0);

    const total = Math.max(0, subtotal - deductions);

    // Line item handlers
    const addItem = () => {
        setItems([
            ...items,
            {
                id: crypto.randomUUID(),
                description: "",
                quantity: 1,
                unitPricePence: 0,
                itemType: "SESSION_FEE",
            },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof LineItem, value: any) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!guardianId) {
            alert("Please select a guardian");
            return;
        }

        if (items.some((item) => !item.description)) {
            alert("Please fill in all line item descriptions");
            return;
        }

        try {
            await createInvoice.mutateAsync({
                guardianId,
                issueDate,
                dueDate,
                notes: notes || undefined,
                items: items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPricePence: item.unitPricePence,
                    itemType: item.itemType,
                })),
            });
            router.push("/billing/invoices");
        } catch (error) {
            console.error("Failed to create invoice:", error);
            alert("Failed to create invoice");
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/billing/invoices">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create Invoice</h1>
                    <p className="text-muted-foreground">
                        Create a new invoice for a guardian
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Guardian & Dates */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Invoice Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <Label>Guardian (Bill Payer)</Label>
                                <Select
                                    value={guardianId}
                                    onValueChange={setGuardianId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select guardian..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {guardians?.map((g) => (
                                            <SelectItem key={g.id} value={g.id}>
                                                {g.firstName} {g.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Issue Date</Label>
                                <Input
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Line Items */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Line Items</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-12 gap-3 p-4 rounded-lg border bg-muted/30"
                            >
                                <div className="col-span-12 md:col-span-4">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        placeholder="e.g., Weekly sessions"
                                        value={item.description}
                                        onChange={(e) =>
                                            updateItem(item.id, "description", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Label className="text-xs">Type</Label>
                                    <Select
                                        value={item.itemType}
                                        onValueChange={(v) =>
                                            updateItem(item.id, "itemType", v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ITEM_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-3 md:col-span-2">
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateItem(
                                                item.id,
                                                "quantity",
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Label className="text-xs">Unit Price (£)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={(item.unitPricePence / 100).toFixed(2)}
                                        onChange={(e) =>
                                            updateItem(
                                                item.id,
                                                "unitPricePence",
                                                Math.round(parseFloat(e.target.value || "0") * 100)
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-span-1 flex items-end justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => removeItem(item.id)}
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Totals */}
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatPence(subtotal)}</span>
                            </div>
                            {deductions > 0 && (
                                <div className="flex justify-between text-sm text-green-500">
                                    <span>Funding/Discounts</span>
                                    <span>-{formatPence(deductions)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total</span>
                                <span>{formatPence(total)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-lg">Notes (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Any additional notes for this invoice..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/billing/invoices">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={createInvoice.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {createInvoice.isPending ? "Creating..." : "Create Invoice"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
