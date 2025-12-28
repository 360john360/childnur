import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Types
export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPricePence: number;
    totalPence: number;
    itemType: string;
    child?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface Payment {
    id: string;
    amountPence: number;
    method: string;
    reference?: string;
    receivedAt: string;
    notes?: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    subtotalPence: number;
    discountPence: number;
    fundingPence: number;
    totalPence: number;
    paidPence: number;
    status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
    paidAt?: string;
    notes?: string;
    guardian: {
        id: string;
        title?: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        mobile?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        postcode?: string;
    };
    items: InvoiceItem[];
    payments?: Payment[];
    _count?: {
        payments: number;
    };
}

export interface BillingSummary {
    outstandingPence: number;
    overdueCount: number;
    thisMonthPaidPence: number;
    recentInvoices: Invoice[];
}

export interface CreateInvoiceData {
    guardianId: string;
    issueDate: string;
    dueDate: string;
    notes?: string;
    items: {
        childId?: string;
        description: string;
        quantity: number;
        unitPricePence: number;
        itemType: string;
    }[];
}

export interface RecordPaymentData {
    invoiceId: string;
    amountPence: number;
    method: string;
    reference?: string;
    receivedAt: string;
    notes?: string;
}

// Hooks

export function useBillingSummary() {
    return useQuery<BillingSummary>({
        queryKey: ["billing", "summary"],
        queryFn: async () => {
            const { data } = await apiClient.get<BillingSummary>("/billing/summary");
            return data;
        },
    });
}

export function useInvoices(options?: {
    status?: string;
    guardianId?: string;
    childId?: string;
}) {
    return useQuery<{ invoices: Invoice[]; total: number }>({
        queryKey: ["billing", "invoices", options],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (options?.status) params.append("status", options.status);
            if (options?.guardianId) params.append("guardianId", options.guardianId);
            if (options?.childId) params.append("childId", options.childId);
            const query = params.toString() ? `?${params}` : "";
            const { data } = await apiClient.get<{ invoices: Invoice[]; total: number }>(
                `/billing/invoices${query}`
            );
            return data;
        },
    });
}

export function useInvoice(id: string | undefined) {
    return useQuery<Invoice>({
        queryKey: ["billing", "invoice", id],
        queryFn: async () => {
            const { data } = await apiClient.get<Invoice>(`/billing/invoices/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateInvoiceData) => {
            const { data: result } = await apiClient.post<Invoice>("/billing/invoices", data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing"] });
        },
    });
}

export function useRecordPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: RecordPaymentData) => {
            const { data: result } = await apiClient.post("/billing/payments", data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing"] });
        },
    });
}

export function useUpdateInvoiceStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { data } = await apiClient.post(`/billing/invoices/${id}/status`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing"] });
        },
    });
}

// Formatting helpers

export function formatPence(pence: number): string {
    return `£${(pence / 100).toFixed(2)}`;
}

export function getStatusColor(status: Invoice["status"]): string {
    switch (status) {
        case "PAID":
            return "bg-green-500/10 text-green-500";
        case "PARTIALLY_PAID":
            return "bg-blue-500/10 text-blue-500";
        case "SENT":
            return "bg-yellow-500/10 text-yellow-500";
        case "OVERDUE":
            return "bg-red-500/10 text-red-500";
        case "DRAFT":
            return "bg-gray-500/10 text-gray-500";
        case "CANCELLED":
            return "bg-gray-500/10 text-gray-500";
        case "REFUNDED":
            return "bg-purple-500/10 text-purple-500";
        default:
            return "bg-gray-500/10 text-gray-500";
    }
}
