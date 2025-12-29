import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

interface CreateInvoiceDto {
    guardianId: string;
    issueDate: Date;
    dueDate: Date;
    notes?: string;
    items: {
        childId?: string;
        description: string;
        quantity: number;
        unitPricePence: number;
        itemType: string;
    }[];
}

interface RecordPaymentDto {
    invoiceId: string;
    amountPence: number;
    method: PaymentMethod;
    reference?: string;
    receivedAt: Date;
    notes?: string;
}

@Injectable()
export class BillingService {
    constructor(private prisma: PrismaService) { }

    /**
     * Generate next invoice number for tenant
     */
    private async generateInvoiceNumber(tenantId: string): Promise<string> {
        const count = await this.prisma.invoice.count({
            where: { tenantId },
        });
        const year = new Date().getFullYear();
        return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    /**
     * Create a new invoice with line items
     */
    async createInvoice(tenantId: string, dto: CreateInvoiceDto) {
        const invoiceNumber = await this.generateInvoiceNumber(tenantId);

        // Calculate totals
        let subtotalPence = 0;
        let fundingPence = 0;

        const itemsData = dto.items.map((item) => {
            const totalPence = Math.round(item.quantity * item.unitPricePence);

            // Track funding deductions
            if (item.itemType === 'FUNDING_REDUCTION') {
                fundingPence += Math.abs(totalPence);
            } else {
                subtotalPence += totalPence;
            }

            return {
                tenantId,
                childId: item.childId,
                description: item.description,
                quantity: item.quantity,
                unitPricePence: item.unitPricePence,
                totalPence,
                itemType: item.itemType as any,
            };
        });

        const totalPence = subtotalPence - fundingPence;

        return this.prisma.invoice.create({
            data: {
                tenantId,
                guardianId: dto.guardianId,
                invoiceNumber,
                issueDate: dto.issueDate,
                dueDate: dto.dueDate,
                subtotalPence,
                fundingPence,
                totalPence: Math.max(0, totalPence),
                notes: dto.notes,
                items: {
                    create: itemsData,
                },
            },
            include: {
                items: true,
                guardian: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Get all invoices for a tenant with filters
     */
    async getInvoices(
        tenantId: string,
        options?: {
            status?: InvoiceStatus;
            guardianId?: string;
            childId?: string;
            limit?: number;
            offset?: number;
        }
    ) {
        const where: any = { tenantId };

        if (options?.status) {
            where.status = options.status;
        }

        if (options?.guardianId) {
            where.guardianId = options.guardianId;
        }

        if (options?.childId) {
            where.items = {
                some: { childId: options.childId },
            };
        }

        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                include: {
                    guardian: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    items: {
                        include: {
                            child: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: { payments: true },
                    },
                },
                orderBy: { issueDate: 'desc' },
                take: options?.limit || 50,
                skip: options?.offset || 0,
            }),
            this.prisma.invoice.count({ where }),
        ]);

        return { invoices, total };
    }

    /**
     * Get a single invoice with all details
     */
    async getInvoice(tenantId: string, invoiceId: string) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
            include: {
                guardian: {
                    select: {
                        id: true,
                        title: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        mobile: true,
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        postcode: true,
                    },
                },
                items: {
                    include: {
                        child: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                payments: {
                    orderBy: { receivedAt: 'desc' },
                },
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        return invoice;
    }

    /**
     * Record a payment against an invoice
     */
    async recordPayment(tenantId: string, dto: RecordPaymentDto, recordedById?: string) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: dto.invoiceId, tenantId },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        if (invoice.status === 'CANCELLED') {
            throw new BadRequestException('Cannot record payment on cancelled invoice');
        }

        if (invoice.status === 'PAID') {
            throw new BadRequestException('Invoice is already fully paid');
        }

        const newPaidPence = invoice.paidPence + dto.amountPence;
        let newStatus: InvoiceStatus = invoice.status;

        if (newPaidPence >= invoice.totalPence) {
            newStatus = 'PAID';
        } else if (newPaidPence > 0) {
            newStatus = 'PARTIALLY_PAID';
        }

        // Create payment and update invoice in a transaction
        const [payment, updatedInvoice] = await this.prisma.$transaction([
            this.prisma.payment.create({
                data: {
                    tenantId,
                    invoiceId: dto.invoiceId,
                    amountPence: dto.amountPence,
                    method: dto.method,
                    reference: dto.reference,
                    receivedAt: dto.receivedAt,
                    notes: dto.notes,
                    recordedById,
                },
            }),
            this.prisma.invoice.update({
                where: { id: dto.invoiceId },
                data: {
                    paidPence: newPaidPence,
                    status: newStatus,
                    paidAt: newStatus === 'PAID' ? new Date() : undefined,
                },
            }),
        ]);

        return { payment, invoice: updatedInvoice };
    }

    /**
     * Update invoice status (e.g., mark as sent)
     */
    async updateInvoiceStatus(tenantId: string, invoiceId: string, status: InvoiceStatus) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        return this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { status },
        });
    }

    /**
     * Get billing summary stats
     */
    async getBillingSummary(tenantId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalOutstanding,
            overdueCount,
            thisMonthPaid,
            recentInvoices,
        ] = await Promise.all([
            // Total outstanding amount
            this.prisma.invoice.aggregate({
                where: {
                    tenantId,
                    status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
                },
                _sum: {
                    totalPence: true,
                    paidPence: true,
                },
            }),
            // Overdue count
            this.prisma.invoice.count({
                where: {
                    tenantId,
                    status: 'OVERDUE',
                },
            }),
            // Payments this month
            this.prisma.payment.aggregate({
                where: {
                    tenantId,
                    receivedAt: { gte: startOfMonth },
                },
                _sum: {
                    amountPence: true,
                },
            }),
            // Recent invoices
            this.prisma.invoice.findMany({
                where: { tenantId },
                include: {
                    guardian: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { issueDate: 'desc' },
                take: 5,
            }),
        ]);

        const outstandingSum = totalOutstanding._sum.totalPence || 0;
        const paidSum = totalOutstanding._sum.paidPence || 0;

        return {
            outstandingPence: outstandingSum - paidSum,
            overdueCount,
            thisMonthPaidPence: thisMonthPaid._sum.amountPence || 0,
            recentInvoices,
        };
    }

    /**
     * Get outstanding debt per guardian
     */
    async getOutstandingByGuardian(tenantId: string) {
        const debts = await this.prisma.invoice.groupBy({
            by: ['guardianId'],
            where: {
                tenantId,
                status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
            },
            _sum: {
                totalPence: true,
                paidPence: true,
            },
        });

        // Get guardian details
        const guardianIds = debts.map((d) => d.guardianId);
        const guardians = await this.prisma.guardian.findMany({
            where: { id: { in: guardianIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });

        const guardianMap = new Map(guardians.map((g) => [g.id, g]));

        return debts.map((d) => ({
            guardian: guardianMap.get(d.guardianId),
            outstandingPence: (d._sum.totalPence || 0) - (d._sum.paidPence || 0),
        })).filter((d) => d.outstandingPence > 0);
    }

    /**
     * Mark overdue invoices
     */
    async markOverdueInvoices(tenantId: string) {
        const now = new Date();

        const result = await this.prisma.invoice.updateMany({
            where: {
                tenantId,
                status: { in: ['SENT', 'PARTIALLY_PAID'] },
                dueDate: { lt: now },
            },
            data: {
                status: 'OVERDUE',
            },
        });

        return { updated: result.count };
    }
}
