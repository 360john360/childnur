"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Wallet,
    Plus,
    FileText,
    TrendingUp,
    AlertTriangle,
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    useBillingSummary,
    useInvoices,
    formatPence,
    getStatusColor,
} from "@/hooks/use-billing";

export default function BillingPage() {
    const { data: summary, isLoading: summaryLoading } = useBillingSummary();
    const { data: invoicesData, isLoading: invoicesLoading } = useInvoices();

    const isLoading = summaryLoading || invoicesLoading;

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-muted rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: "Outstanding",
            value: formatPence(summary?.outstandingPence || 0),
            icon: Wallet,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
        },
        {
            label: "Overdue",
            value: summary?.overdueCount || 0,
            icon: AlertTriangle,
            color: "text-red-500",
            bgColor: "bg-red-500/10",
        },
        {
            label: "Paid This Month",
            value: formatPence(summary?.thisMonthPaidPence || 0),
            icon: TrendingUp,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Billing</h1>
                    <p className="text-muted-foreground">
                        Manage invoices and track payments
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/billing/invoices">
                            <FileText className="h-4 w-4 mr-2" />
                            All Invoices
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/billing/invoices/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Invoice
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="glass-subtle hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {stat.label}
                                        </p>
                                        <p className="text-3xl font-bold mt-1">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div
                                        className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                                    >
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Invoices */}
            <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Recent Invoices</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/billing/invoices">
                            View All <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {!invoicesData?.invoices?.length ? (
                        <div className="text-center py-12">
                            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium mb-2">No invoices yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first invoice to start tracking payments
                            </p>
                            <Button asChild>
                                <Link href="/billing/invoices/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Invoice
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {invoicesData.invoices.slice(0, 5).map((invoice) => (
                                <Link
                                    key={invoice.id}
                                    href={`/billing/invoices/${invoice.id}`}
                                    className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors border"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
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
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-medium">
                                                {formatPence(invoice.totalPence)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
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
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-subtle">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium">Outstanding Debts</h3>
                                <p className="text-sm text-muted-foreground">
                                    View all guardians with unpaid invoices
                                </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/billing/outstanding">View</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-subtle">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium">Record Payment</h3>
                                <p className="text-sm text-muted-foreground">
                                    Log a payment received from a parent
                                </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/billing/payments/record">Record</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
