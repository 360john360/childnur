"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FileText,
    Plus,
    Filter,
    Search,
    ArrowLeft,
    ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useInvoices,
    formatPence,
    getStatusColor,
    Invoice,
} from "@/hooks/use-billing";

export default function InvoicesListPage() {
    const [statusFilter, setStatusFilter] = useState<string>("");
    const { data, isLoading } = useInvoices({
        status: statusFilter || undefined,
    });

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-muted rounded" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 bg-muted rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/billing">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Invoices</h1>
                        <p className="text-muted-foreground">
                            {data?.total || 0} total invoices
                        </p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/billing/invoices/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Invoice List */}
            <Card className="glass">
                <CardContent className="p-0">
                    {!data?.invoices?.length ? (
                        <div className="text-center py-16">
                            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium mb-2">No invoices found</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {statusFilter
                                    ? "Try a different filter"
                                    : "Create your first invoice"}
                            </p>
                            {!statusFilter && (
                                <Button asChild>
                                    <Link href="/billing/invoices/new">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Invoice
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {data.invoices.map((invoice, index) => (
                                <motion.div
                                    key={invoice.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        href={`/billing/invoices/${invoice.id}`}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {invoice.invoiceNumber}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {invoice.guardian.firstName}{" "}
                                                    {invoice.guardian.lastName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-bold text-lg">
                                                    {formatPence(invoice.totalPence)}
                                                </p>
                                                {invoice.paidPence > 0 &&
                                                    invoice.paidPence < invoice.totalPence && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Paid: {formatPence(invoice.paidPence)}
                                                        </p>
                                                    )}
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <p className="text-sm text-muted-foreground">
                                                    Due{" "}
                                                    {new Date(
                                                        invoice.dueDate
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={getStatusColor(invoice.status)}
                                            >
                                                {invoice.status.replace("_", " ")}
                                            </Badge>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
