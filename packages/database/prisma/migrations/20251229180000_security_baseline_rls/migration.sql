-- ============================================================================
-- SECURITY BASELINE: ROW-LEVEL SECURITY (RLS) MIGRATION
-- Multi-tenant data isolation at the Postgres layer
-- ============================================================================

-- ============================================================================
-- STEP 1: Add tenant_id columns to tables that need them
-- ============================================================================

-- ChildGuardian: Add tenant_id and populate from children table
ALTER TABLE child_guardians ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE child_guardians SET tenant_id = (SELECT tenant_id FROM children WHERE children.id = child_guardians.child_id);
ALTER TABLE child_guardians ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE child_guardians ADD CONSTRAINT fk_child_guardians_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_child_guardians_tenant_id ON child_guardians(tenant_id);

-- EmergencyContact: Add tenant_id and populate from children table  
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE emergency_contacts SET tenant_id = (SELECT tenant_id FROM children WHERE children.id = emergency_contacts.child_id);
ALTER TABLE emergency_contacts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE emergency_contacts ADD CONSTRAINT fk_emergency_contacts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_tenant_id ON emergency_contacts(tenant_id);

-- AttendanceRecord: Add tenant_id and populate from children table
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE attendance_records SET tenant_id = (SELECT tenant_id FROM children WHERE children.id = attendance_records.child_id);
ALTER TABLE attendance_records ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE attendance_records ADD CONSTRAINT fk_attendance_records_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_id ON attendance_records(tenant_id);

-- TwoYearCheck: Add tenant_id and populate from children table
ALTER TABLE two_year_checks ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE two_year_checks SET tenant_id = (SELECT tenant_id FROM children WHERE children.id = two_year_checks.child_id) WHERE EXISTS (SELECT 1 FROM children WHERE children.id = two_year_checks.child_id);
-- Allow NULL temporarily for tables that might be empty
ALTER TABLE two_year_checks ADD CONSTRAINT fk_two_year_checks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_two_year_checks_tenant_id ON two_year_checks(tenant_id);

-- InvoiceItem: Add tenant_id and populate from invoices table
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE invoice_items SET tenant_id = (SELECT tenant_id FROM invoices WHERE invoices.id = invoice_items.invoice_id);
-- Allow NULL for now since there might be no invoices
ALTER TABLE invoice_items ADD CONSTRAINT fk_invoice_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_id ON invoice_items(tenant_id);

-- Message: Add tenant_id and populate from conversations table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE messages SET tenant_id = (SELECT tenant_id FROM conversations WHERE conversations.id = messages.conversation_id);
-- Allow NULL for now since there might be no messages
ALTER TABLE messages ADD CONSTRAINT fk_messages_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id);

-- AnnouncementRead: Add tenant_id and populate from announcements table
ALTER TABLE announcement_reads ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE announcement_reads SET tenant_id = (SELECT tenant_id FROM announcements WHERE announcements.id = announcement_reads.announcement_id);
-- Allow NULL for now since there might be no reads
ALTER TABLE announcement_reads ADD CONSTRAINT fk_announcement_reads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_announcement_reads_tenant_id ON announcement_reads(tenant_id);

-- ============================================================================
-- STEP 2: Create the tenant context function
-- ============================================================================

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
DECLARE
    tenant_setting TEXT;
BEGIN
    tenant_setting := current_setting('app.current_tenant', true);
    IF tenant_setting IS NULL OR tenant_setting = '' THEN
        RETURN NULL;
    END IF;
    RETURN tenant_setting::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Enable and Force RLS on all tenant-scoped tables
-- ============================================================================

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_rooms ON rooms;
CREATE POLICY tenant_isolation_rooms ON rooms
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_staff ON staff;
CREATE POLICY tenant_isolation_staff ON staff
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE children FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_children ON children;
CREATE POLICY tenant_isolation_children ON children
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Guardians
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_guardians ON guardians;
CREATE POLICY tenant_isolation_guardians ON guardians
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- ChildGuardians
ALTER TABLE child_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_guardians FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_child_guardians ON child_guardians;
CREATE POLICY tenant_isolation_child_guardians ON child_guardians
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- EmergencyContacts
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_emergency_contacts ON emergency_contacts;
CREATE POLICY tenant_isolation_emergency_contacts ON emergency_contacts
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- DailyLogs
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_daily_logs ON daily_logs;
CREATE POLICY tenant_isolation_daily_logs ON daily_logs
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- AttendanceRecords
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_attendance_records ON attendance_records;
CREATE POLICY tenant_isolation_attendance_records ON attendance_records
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Observations
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_observations ON observations;
CREATE POLICY tenant_isolation_observations ON observations
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- TwoYearChecks
ALTER TABLE two_year_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_year_checks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_two_year_checks ON two_year_checks;
CREATE POLICY tenant_isolation_two_year_checks ON two_year_checks
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Accidents
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_accidents ON accidents;
CREATE POLICY tenant_isolation_accidents ON accidents
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- SafeguardingLogs
ALTER TABLE safeguarding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safeguarding_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_safeguarding_logs ON safeguarding_logs;
CREATE POLICY tenant_isolation_safeguarding_logs ON safeguarding_logs
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- MedicationRecords
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_medication_records ON medication_records;
CREATE POLICY tenant_isolation_medication_records ON medication_records
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_invoices ON invoices;
CREATE POLICY tenant_isolation_invoices ON invoices
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- InvoiceItems
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_invoice_items ON invoice_items;
CREATE POLICY tenant_isolation_invoice_items ON invoice_items
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
CREATE POLICY tenant_isolation_payments ON payments
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- ConsentRecords
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_consent_records ON consent_records;
CREATE POLICY tenant_isolation_consent_records ON consent_records
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Newsletters
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_newsletters ON newsletters;
CREATE POLICY tenant_isolation_newsletters ON newsletters
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_conversations ON conversations;
CREATE POLICY tenant_isolation_conversations ON conversations
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_messages ON messages;
CREATE POLICY tenant_isolation_messages ON messages
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_announcements ON announcements;
CREATE POLICY tenant_isolation_announcements ON announcements
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- AnnouncementReads
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_announcement_reads ON announcement_reads;
CREATE POLICY tenant_isolation_announcement_reads ON announcement_reads
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- AuditLogs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- ============================================================================
-- STEP 4: Grant usage to the application database user
-- The app must call SET LOCAL app.current_tenant = 'uuid' before queries
-- ============================================================================

-- Note: The application must set the tenant context before each request:
--   SELECT set_config('app.current_tenant', '<tenant-uuid>', true);
-- The 'true' parameter makes it LOCAL to the current transaction
