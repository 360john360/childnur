"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    Mail,
    Phone,
    User,
    Calendar,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    Plus,
    Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    useInvoice,
    useRecordPayment,
    useUpdateInvoiceStatus,
    formatPence,
    getStatusColor,
} from "@/hooks/use-billing";

const PAYMENT_METHODS = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CARD", label: "Card" },
    { value: "TAX_FREE_CHILDCARE", label: "Tax-Free Childcare" },
    { value: "CHILDCARE_VOUCHER", label: "Childcare Voucher" },
    { value: "DIRECT_DEBIT", label: "Direct Debit" },
    { value: "OTHER", label: "Other" },
];

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;

    const { data: invoice, isLoading } = useInvoice(invoiceId);
    const recordPayment = useRecordPayment();
    const updateStatus = useUpdateInvoiceStatus();

    // Payment form state
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
    const [paymentReference, setPaymentReference] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="h-64 bg-muted rounded-xl" />
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-6">
                <div className="text-center py-16">
                    <h2 className="text-xl font-bold mb-2">Invoice not found</h2>
                    <Button asChild>
                        <Link href="/billing/invoices">Back to Invoices</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const outstandingPence = invoice.totalPence - invoice.paidPence;

    const handleRecordPayment = async () => {
        const amountPence = Math.round(parseFloat(paymentAmount) * 100);
        if (!amountPence || amountPence <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        try {
            await recordPayment.mutateAsync({
                invoiceId,
                amountPence,
                method: paymentMethod,
                reference: paymentReference || undefined,
                receivedAt: new Date().toISOString(),
                notes: paymentNotes || undefined,
            });
            setShowPaymentDialog(false);
            setPaymentAmount("");
            setPaymentReference("");
            setPaymentNotes("");
        } catch (error) {
            console.error("Failed to record payment:", error);
            alert("Failed to record payment");
        }
    };

    const handleMarkAsSent = async () => {
        try {
            await updateStatus.mutateAsync({ id: invoiceId, status: "SENT" });
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/billing/invoices">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">
                                {invoice.invoiceNumber}
                            </h1>
                            <Badge
                                variant="secondary"
                                className={getStatusColor(invoice.status)}
                            >
                                {invoice.status.replace("_", " ")}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Created{" "}
                            {new Date(invoice.issueDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {invoice.status === "DRAFT" && (
                        <Button
                            variant="outline"
                            onClick={handleMarkAsSent}
                            disabled={updateStatus.isPending}
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Mark as Sent
                        </Button>
                    )}
                    {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                            <DialogTrigger asChild>
                                <Button>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Record Payment
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Record Payment</DialogTitle>
                                    <DialogDescription>
                                        Outstanding: {formatPence(outstandingPence)}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Amount (£)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder={(outstandingPence / 100).toFixed(2)}
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Payment Method</Label>
                                        <Select
                                            value={paymentMethod}
                                            onValueChange={setPaymentMethod}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_METHODS.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Reference (Optional)</Label>
                                        <Input
                                            placeholder="e.g., Bank ref, TFC code"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Notes (Optional)</Label>
                                        <Textarea
                                            placeholder="Any notes about this payment..."
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowPaymentDialog(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleRecordPayment}
                                        disabled={recordPayment.isPending}
                                    >
                                        {recordPayment.isPending
                                            ? "Recording..."
                                            : "Record Payment"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Line Items */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg">Line Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-border">
                                {invoice.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="py-3 flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-medium">{item.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.quantity} × {formatPence(item.unitPricePence)}
                                                {item.child && (
                                                    <span className="ml-2">
                                                        • {item.child.firstName} {item.child.lastName}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <p className="font-medium">
                                            {formatPence(item.totalPence)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="border-t mt-4 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatPence(invoice.subtotalPence)}</span>
                                </div>
                                {invoice.fundingPence > 0 && (
                                    <div className="flex justify-between text-sm text-green-500">
                                        <span>Funding</span>
                                        <span>-{formatPence(invoice.fundingPence)}</span>
                                    </div>
                                )}
                                {invoice.discountPence > 0 && (
                                    <div className="flex justify-between text-sm text-green-500">
                                        <span>Discount</span>
                                        <span>-{formatPence(invoice.discountPence)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Total</span>
                                    <span>{formatPence(invoice.totalPence)}</span>
                                </div>
                                {invoice.paidPence > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm text-green-500">
                                            <span>Paid</span>
                                            <span>-{formatPence(invoice.paidPence)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span>Outstanding</span>
                                            <span>{formatPence(outstandingPence)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="text-lg">Payment History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {invoice.payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {formatPence(payment.amountPence)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {payment.method.replace("_", " ")}
                                                        {payment.reference && ` • ${payment.reference}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-muted-foreground">
                                                {new Date(payment.receivedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {invoice.notes && (
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="text-lg">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{invoice.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Guardian Info */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Bill To
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-medium">
                                    {invoice.guardian.firstName} {invoice.guardian.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {invoice.guardian.email}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dates */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Dates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Issue Date</span>
                                <span>
                                    {new Date(invoice.issueDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Due Date</span>
                                <span
                                    className={
                                        new Date(invoice.dueDate) < new Date() &&
                                            invoice.status !== "PAID"
                                            ? "text-red-500 font-medium"
                                            : ""
                                    }
                                >
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                            {invoice.paidAt && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Paid Date</span>
                                    <span className="text-green-500">
                                        {new Date(invoice.paidAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="glass border-primary/20">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                    {invoice.status === "PAID" ? "Total Paid" : "Outstanding"}
                                </p>
                                <p className="text-3xl font-bold">
                                    {formatPence(
                                        invoice.status === "PAID"
                                            ? invoice.totalPence
                                            : outstandingPence
                                    )}
                                </p>
                                {invoice.status === "PAID" && (
                                    <div className="flex items-center justify-center gap-1 text-green-500 mt-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm">Fully Paid</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
