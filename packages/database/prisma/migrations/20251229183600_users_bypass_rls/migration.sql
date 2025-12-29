-- Allow system bypass for users table to enable login lookups
DROP POLICY IF EXISTS "tenant_isolation" ON "users";

CREATE POLICY "tenant_isolation" ON "users"
USING (
    tenant_id = current_tenant_id() 
    OR current_setting('app.bypass_rls', true) = 'on'
)
WITH CHECK (
    tenant_id = current_tenant_id()
    OR current_setting('app.bypass_rls', true) = 'on'
);
