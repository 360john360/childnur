-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'TAX_FREE_CHILDCARE', 'CHILDCARE_VOUCHER', 'DIRECT_DEBIT', 'OTHER');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "paid_pence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount_pence" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" VARCHAR(100),
    "received_at" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,
    "recorded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
