"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import {
    ArrowLeft,
    Mail,
    Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    useInvoice,
    useRecordPayment,
    useUpdateInvoiceStatus,
    formatPence,
    getStatusColor,
} from "@/hooks/use-billing";
import { RecordPaymentDialog, PaymentHistoryCard } from "@/features/billing/components";

// Payment methods moved to @/features/billing/components/RecordPaymentDialog.tsx

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;
    const printRef = useRef<HTMLDivElement>(null);

    const { data: invoice, isLoading } = useInvoice(invoiceId);
    const recordPayment = useRecordPayment();
    const updateStatus = useUpdateInvoiceStatus();

    // react-to-print hook
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: invoice?.invoiceNumber || "Invoice",
        pageStyle: `
            @page {
                size: A4;
                margin: 20mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
        `,
    });

    // Payment handler for the RecordPaymentDialog
    const handleRecordPayment = async (data: {
        amountPence: number;
        method: string;
        reference?: string;
        notes?: string;
    }) => {
        await recordPayment.mutateAsync({
            invoiceId,
            amountPence: data.amountPence,
            method: data.method,
            reference: data.reference,
            receivedAt: new Date().toISOString(),
            notes: data.notes,
        });
    };

    const handleMarkAsSent = async () => {
        try {
            await updateStatus.mutateAsync({ id: invoiceId, status: "SENT" });
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

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

    // Format guardian address
    const guardianAddress = [
        invoice.guardian.addressLine1,
        invoice.guardian.addressLine2,
        invoice.guardian.city,
        invoice.guardian.postcode,
    ].filter(Boolean).join(", ");

    const guardianPhone = invoice.guardian.mobile || invoice.guardian.phone;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header - Actions for the page */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/billing">
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
                    <Button variant="outline" onClick={() => handlePrint()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Invoice
                    </Button>
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
                        <RecordPaymentDialog
                            outstandingPence={outstandingPence}
                            onRecordPayment={handleRecordPayment}
                            isPending={recordPayment.isPending}
                        />
                    )}
                </div>
            </div>

            {/* ===== PRINTABLE INVOICE COMPONENT ===== */}
            <div
                ref={printRef}
                style={{
                    backgroundColor: "white",
                    color: "black",
                    fontFamily: "Arial, Helvetica, sans-serif",
                }}
            >
                {/* Invoice Header */}
                <div style={{
                    padding: "32px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "linear-gradient(135deg, #f3f0ff 0%, #e8f4f8 100%)",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h1 style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                color: "#7c3aed",
                                margin: 0,
                            }}>
                                INVOICE
                            </h1>
                            <p style={{
                                fontSize: "20px",
                                fontFamily: "monospace",
                                marginTop: "4px",
                                color: "#374151",
                            }}>
                                {invoice.invoiceNumber}
                            </p>
                        </div>
                        <div style={{
                            padding: "6px 16px",
                            borderRadius: "20px",
                            backgroundColor: invoice.status === "PAID" ? "#dcfce7" : "#f3f4f6",
                            color: invoice.status === "PAID" ? "#166534" : "#374151",
                            fontSize: "14px",
                            fontWeight: "600",
                        }}>
                            {invoice.status.replace("_", " ")}
                        </div>
                    </div>
                </div>

                {/* Bill To & Invoice Details */}
                <div style={{
                    padding: "32px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "32px",
                    borderBottom: "1px solid #e5e7eb",
                }}>
                    {/* Bill To */}
                    <div>
                        <h3 style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: "12px",
                        }}>
                            Bill To
                        </h3>
                        <div style={{ lineHeight: "1.6" }}>
                            <p style={{ fontWeight: "600", fontSize: "16px", margin: "0 0 4px 0" }}>
                                {invoice.guardian.title && `${invoice.guardian.title} `}
                                {invoice.guardian.firstName} {invoice.guardian.lastName}
                            </p>
                            {guardianAddress && (
                                <p style={{ color: "#6b7280", margin: "0 0 4px 0" }}>{guardianAddress}</p>
                            )}
                            <p style={{ color: "#6b7280", margin: "0 0 4px 0" }}>{invoice.guardian.email}</p>
                            {guardianPhone && (
                                <p style={{ color: "#6b7280", margin: 0 }}>{guardianPhone}</p>
                            )}
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div style={{ textAlign: "right" }}>
                        <h3 style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: "12px",
                        }}>
                            Invoice Details
                        </h3>
                        <table style={{ marginLeft: "auto", fontSize: "14px" }}>
                            <tbody>
                                <tr>
                                    <td style={{ paddingRight: "16px", color: "#6b7280", paddingBottom: "4px" }}>Invoice Date:</td>
                                    <td style={{ fontWeight: "500" }}>
                                        {new Date(invoice.issueDate).toLocaleDateString("en-GB", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ paddingRight: "16px", color: "#6b7280", paddingBottom: "4px" }}>Due Date:</td>
                                    <td style={{
                                        fontWeight: "500",
                                        color: new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID"
                                            ? "#dc2626"
                                            : "inherit"
                                    }}>
                                        {new Date(invoice.dueDate).toLocaleDateString("en-GB", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </td>
                                </tr>
                                {invoice.paidAt && (
                                    <tr>
                                        <td style={{ paddingRight: "16px", color: "#6b7280" }}>Paid Date:</td>
                                        <td style={{ fontWeight: "500", color: "#16a34a" }}>
                                            {new Date(invoice.paidAt).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Line Items Table */}
                <div style={{ padding: "32px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                                <th style={{
                                    textAlign: "left",
                                    padding: "12px 0",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}>
                                    Description
                                </th>
                                <th style={{
                                    textAlign: "right",
                                    padding: "12px 0",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    width: "80px",
                                }}>
                                    Qty
                                </th>
                                <th style={{
                                    textAlign: "right",
                                    padding: "12px 0",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    width: "120px",
                                }}>
                                    Unit Price
                                </th>
                                <th style={{
                                    textAlign: "right",
                                    padding: "12px 0",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    width: "120px",
                                }}>
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items?.map((item, index) => (
                                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "16px 0" }}>
                                        <p style={{ fontWeight: "500", margin: 0 }}>{item.description}</p>
                                        {item.child && (
                                            <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                                                {item.child.firstName} {item.child.lastName}
                                            </p>
                                        )}
                                    </td>
                                    <td style={{ textAlign: "right", padding: "16px 0" }}>{item.quantity}</td>
                                    <td style={{ textAlign: "right", padding: "16px 0" }}>{formatPence(item.unitPricePence)}</td>
                                    <td style={{ textAlign: "right", padding: "16px 0", fontWeight: "500" }}>
                                        {formatPence(item.totalPence)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
                        <div style={{ width: "280px" }}>
                            <div style={{ fontSize: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                    <span style={{ color: "#6b7280" }}>Subtotal</span>
                                    <span style={{ fontWeight: "500" }}>{formatPence(invoice.subtotalPence)}</span>
                                </div>
                                {invoice.fundingPence > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#16a34a" }}>
                                        <span>Funding Deduction</span>
                                        <span>-{formatPence(invoice.fundingPence)}</span>
                                    </div>
                                )}
                                {invoice.discountPence > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#16a34a" }}>
                                        <span>Discount</span>
                                        <span>-{formatPence(invoice.discountPence)}</span>
                                    </div>
                                )}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "12px 0",
                                    borderTop: "2px solid #e5e7eb",
                                    borderBottom: "2px solid #e5e7eb",
                                    fontSize: "18px",
                                    fontWeight: "bold",
                                }}>
                                    <span>Total</span>
                                    <span>{formatPence(invoice.totalPence)}</span>
                                </div>
                                {invoice.paidPence > 0 && (
                                    <>
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#16a34a" }}>
                                            <span>Amount Paid</span>
                                            <span>-{formatPence(invoice.paidPence)}</span>
                                        </div>
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            padding: "12px 0",
                                            borderTop: "1px solid #e5e7eb",
                                            fontSize: "18px",
                                            fontWeight: "bold",
                                        }}>
                                            <span>Balance Due</span>
                                            <span style={{ color: outstandingPence > 0 ? "#dc2626" : "#16a34a" }}>
                                                {formatPence(outstandingPence)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
                            <h3 style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "8px",
                            }}>
                                Notes
                            </h3>
                            <p style={{ color: "#6b7280", margin: 0 }}>{invoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "32px",
                    backgroundColor: "#f9fafb",
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "center",
                }}>
                    <p style={{ fontWeight: "500", margin: "0 0 4px 0", color: "#374151" }}>
                        Thank you for your payment
                    </p>
                    <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
                        Please make payment by bank transfer or contact us for other payment options.
                    </p>
                </div>
            </div>
            {/* ===== END PRINTABLE INVOICE ===== */}

            {/* Payment History - NOT included in print */}
            <PaymentHistoryCard payments={invoice.payments} />
        </div>
    );
}
