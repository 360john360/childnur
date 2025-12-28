-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant data isolation at the database layer
-- ============================================================================

-- Create a function to get the current tenant from session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Enable RLS on all tenant-scoped tables
-- ============================================================================

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = current_tenant_id());

-- Rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_rooms ON rooms
    USING (tenant_id = current_tenant_id());

-- Children table
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE children FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_children ON children
    USING (tenant_id = current_tenant_id());

-- Guardians table
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_guardians ON guardians
    USING (tenant_id = current_tenant_id());

-- Child-Guardian junction table
ALTER TABLE child_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_guardians FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_child_guardians ON child_guardians
    USING (EXISTS (
        SELECT 1 FROM children c WHERE c.id = child_id AND c.tenant_id = current_tenant_id()
    ));

-- Staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_staff ON staff
    USING (tenant_id = current_tenant_id());

-- Daily Logs table
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_daily_logs ON daily_logs
    USING (tenant_id = current_tenant_id());

-- Daily Log Entries table
ALTER TABLE daily_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_daily_log_entries ON daily_log_entries
    USING (tenant_id = current_tenant_id());

-- Sleep Checks table
ALTER TABLE sleep_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_checks FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sleep_checks ON sleep_checks
    USING (EXISTS (
        SELECT 1 FROM daily_log_entries e WHERE e.id = entry_id AND e.tenant_id = current_tenant_id()
    ));

-- Observations table
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_observations ON observations
    USING (tenant_id = current_tenant_id());

-- Accidents table
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_accidents ON accidents
    USING (tenant_id = current_tenant_id());

-- Safeguarding Logs table
ALTER TABLE safeguarding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safeguarding_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_safeguarding_logs ON safeguarding_logs
    USING (tenant_id = current_tenant_id());

-- Medications table  
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_medications ON medications
    USING (tenant_id = current_tenant_id());

-- Medication Administrations table
ALTER TABLE medication_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_administrations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_medication_administrations ON medication_administrations
    USING (tenant_id = current_tenant_id());

-- Invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_invoices ON invoices
    USING (tenant_id = current_tenant_id());

-- Invoice Lines table
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_invoice_lines ON invoice_lines
    USING (EXISTS (
        SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = current_tenant_id()
    ));

-- Payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_payments ON payments
    USING (tenant_id = current_tenant_id());

-- Attendance Records table
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_attendance_records ON attendance_records
    USING (tenant_id = current_tenant_id());

-- Audit Logs table (tenant-scoped but RLS enforced)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Bypass policy for super-admin (platform owner)
-- Usage: SET role TO 'nursery_superadmin';
-- ============================================================================

-- Create a superadmin role that bypasses RLS (for platform analytics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nursery_superadmin') THEN
        CREATE ROLE nursery_superadmin;
    END IF;
END $$;

-- Grant superadmin bypass on all tables
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY superadmin_bypass_users ON users TO nursery_superadmin USING (true);

ALTER TABLE rooms FORCE ROW LEVEL SECURITY;
CREATE POLICY superadmin_bypass_rooms ON rooms TO nursery_superadmin USING (true);

ALTER TABLE children FORCE ROW LEVEL SECURITY;
CREATE POLICY superadmin_bypass_children ON children TO nursery_superadmin USING (true);

-- Add more bypass policies as needed...

-- ============================================================================
-- Notes for Application Integration:
-- 
-- Before each database transaction, the application MUST execute:
--   SET app.current_tenant = '<tenant-uuid>';
-- 
-- This can be done in Prisma middleware or a custom PrismaClient wrapper.
-- ============================================================================
