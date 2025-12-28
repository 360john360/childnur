-- ============================================================================
-- RLS POLICY FIXES
-- Correcting table names that were mismatched in initial migration
-- ============================================================================

-- Fix: invoice_lines -> invoice_items  
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_invoice_items ON invoice_items
    USING (EXISTS (
        SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = current_setting('app.current_tenant', true)::uuid
    ));

-- Fix: medications -> medication_records
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_medication_records ON medication_records
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Fix: attendance_records - uses child relationship for tenant
DROP POLICY IF EXISTS tenant_isolation_attendance_records ON attendance_records;
CREATE POLICY tenant_isolation_attendance_records ON attendance_records
    USING (EXISTS (
        SELECT 1 FROM children c WHERE c.id = child_id AND c.tenant_id = current_setting('app.current_tenant', true)::uuid
    ));

-- ============================================================================
-- DONE - These policies complete the RLS coverage
-- ============================================================================
