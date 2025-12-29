import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Patch,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { IsString, IsOptional, IsArray, IsNumber, IsDateString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';

// DTOs
class InvoiceItemDto {
    @IsString()
    @IsOptional()
    childId?: string;

    @IsString()
    description: string;

    @IsNumber()
    quantity: number;

    @IsNumber()
    unitPricePence: number;

    @IsString()
    itemType: string;
}

class CreateInvoiceDto {
    @IsString()
    guardianId: string;

    @IsDateString()
    issueDate: string;

    @IsDateString()
    dueDate: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items: InvoiceItemDto[];
}

class RecordPaymentDto {
    @IsString()
    invoiceId: string;

    @IsNumber()
    amountPence: number;

    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @IsString()
    @IsOptional()
    reference?: string;

    @IsDateString()
    receivedAt: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

class UpdateStatusDto {
    @IsEnum(InvoiceStatus)
    status: InvoiceStatus;
}

@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    /**
     * Get billing dashboard summary
     */
    @Get('summary')
    @RequirePermissions(Permission.BILLING_READ)
    async getSummary(@Request() req: any) {
        return this.billingService.getBillingSummary(req.user.tenantId);
    }

    /**
     * Get all invoices with optional filters
     */
    @Get('invoices')
    @RequirePermissions(Permission.BILLING_READ)
    async getInvoices(
        @Request() req: any,
        @Query('status') status?: InvoiceStatus,
        @Query('guardianId') guardianId?: string,
        @Query('childId') childId?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.billingService.getInvoices(req.user.tenantId, {
            status,
            guardianId,
            childId,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        });
    }

    /**
     * Get single invoice with details
     */
    @Get('invoices/:id')
    @RequirePermissions(Permission.BILLING_READ)
    async getInvoice(@Request() req: any, @Param('id') id: string) {
        return this.billingService.getInvoice(req.user.tenantId, id);
    }

    /**
     * Create a new invoice
     */
    @Post('invoices')
    @RequirePermissions(Permission.BILLING_WRITE)
    async createInvoice(@Request() req: any, @Body() dto: CreateInvoiceDto) {
        return this.billingService.createInvoice(req.user.tenantId, {
            guardianId: dto.guardianId,
            issueDate: new Date(dto.issueDate),
            dueDate: new Date(dto.dueDate),
            notes: dto.notes,
            items: dto.items,
        });
    }

    /**
     * Update invoice status
     */
    @Patch('invoices/:id/status')
    @RequirePermissions(Permission.BILLING_WRITE)
    async updateInvoiceStatus(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateStatusDto,
    ) {
        return this.billingService.updateInvoiceStatus(
            req.user.tenantId,
            id,
            dto.status,
        );
    }

    /**
     * Record a payment against an invoice
     */
    @Post('payments')
    @RequirePermissions(Permission.BILLING_WRITE)
    async recordPayment(@Request() req: any, @Body() dto: RecordPaymentDto) {
        return this.billingService.recordPayment(
            req.user.tenantId,
            {
                invoiceId: dto.invoiceId,
                amountPence: dto.amountPence,
                method: dto.method,
                reference: dto.reference,
                receivedAt: new Date(dto.receivedAt),
                notes: dto.notes,
            },
            req.user.sub, // recordedById
        );
    }

    /**
     * Get outstanding debts by guardian
     */
    @Get('outstanding')
    @RequirePermissions(Permission.BILLING_READ)
    async getOutstanding(@Request() req: any) {
        return this.billingService.getOutstandingByGuardian(req.user.tenantId);
    }

    /**
     * Mark overdue invoices (can be called by a cron job)
     */
    @Post('mark-overdue')
    @RequirePermissions(Permission.BILLING_WRITE)
    async markOverdue(@Request() req: any) {
        return this.billingService.markOverdueInvoices(req.user.tenantId);
    }
}
