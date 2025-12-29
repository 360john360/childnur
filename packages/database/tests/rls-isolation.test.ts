
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: dbUrl });
const prisma = new PrismaClient();

const TEXT_RESET = '\x1b[0m';
const TEXT_GREEN = '\x1b[32m';

const tenantA = '11111111-1111-1111-1111-111111111111';
const tenantB = '22222222-2222-2222-2222-222222222222';
const childA = '00000000-0000-0000-0000-000000000001';
const childB = '00000000-0000-0000-0000-000000000002';

describe('RLS Isolation Proof Tests', () => {

    beforeAll(async () => {
        await prisma.$connect();

        // 1. Create Test User Role (Low Privilege)
        try {
            await prisma.$executeRawUnsafe(`DO $$ BEGIN
                CREATE ROLE rls_internal_test WITH LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD 'test';
                EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;`);
            await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO rls_internal_test`);
            await prisma.$executeRawUnsafe(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO rls_internal_test`);
        } catch (e) {
            console.warn("Setup warning (Role):", e);
        }

        // 2. Setup Data (Tenants & Children)
        await prisma.$transaction(async (tx) => {
            // Bypass RLS to insert data
            await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;

            // Insert Tenants
            await tx.$executeRawUnsafe(`
                INSERT INTO tenants (id, name, subdomain, primary_color, secondary_color, updated_at) 
                VALUES 
                ('${tenantA}', 'Tenant A', 'tenant-a', '#000000', '#000000', NOW()), 
                ('${tenantB}', 'Tenant B', 'tenant-b', '#000000', '#000000', NOW()) 
                ON CONFLICT (id) DO NOTHING
            `);

            // Clean children for these tenants
            await tx.$executeRawUnsafe(`DELETE FROM children WHERE tenant_id IN ('${tenantA}', '${tenantB}')`);

            // Insert Child A
            await tx.$executeRawUnsafe(`
                INSERT INTO children (id, tenant_id, first_name, last_name, gender, date_of_birth, start_date, status, updated_at) 
                VALUES 
                ('${childA}', '${tenantA}', 'Child', 'A', 'MALE', '2020-01-01', '2020-01-01', 'ACTIVE', NOW())
            `);

            // Insert Child B
            await tx.$executeRawUnsafe(`
                INSERT INTO children (id, tenant_id, first_name, last_name, gender, date_of_birth, start_date, status, updated_at) 
                VALUES 
                ('${childB}', '${tenantB}', 'Child', 'B', 'FEMALE', '2020-01-01', '2020-01-01', 'ACTIVE', NOW())
            `);
        });
    });

    afterAll(async () => {
        try {
            await prisma.$executeRawUnsafe(`DROP ROLE IF EXISTS rls_internal_test`);
            // Cleanup data? Optional, leaving it allows inspection if failed.
            await prisma.$transaction(async (tx) => {
                await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
                await tx.$executeRawUnsafe(`DELETE FROM children WHERE tenant_id IN ('${tenantA}', '${tenantB}')`);
                await tx.$executeRawUnsafe(`DELETE FROM tenants WHERE id IN ('${tenantA}', '${tenantB}')`);
            });
        } catch (e) { }
        await prisma.$disconnect();
        await pool.end();
    });

    // T1: RLS Flags Active
    it('T1: RLS flags are active for critical tables', async () => {
        const requiredTables = ['users', 'children', 'daily_logs', 'invoices', 'messages'];

        const results = await prisma.$queryRawUnsafe<any[]>(`
            SELECT relname, relrowsecurity, relforcerowsecurity
            FROM pg_class
            WHERE relname IN (${requiredTables.map(t => `'${t}'`).join(',')})
        `);

        // Check each table
        const tableMap = new Map(results.map((r: any) => [r.relname, r]));

        requiredTables.forEach(table => {
            const status = tableMap.get(table);
            expect(status).toBeDefined();
            expect(status.relrowsecurity).toBe(true);
            expect(status.relforcerowsecurity).toBe(true);
        });

        console.log(`${TEXT_GREEN}✅ T1: All critical tables have RLS enabled and forced.${TEXT_RESET}`);
    });

    // T2: Cross-tenant isolation with Raw SQL
    it('T2: Raw SQL cross-tenant isolation enforcement', async () => {
        // VERIFY TENANT A ISOLATION
        const clientA = await pool.connect();
        try {
            await clientA.query(`SET ROLE rls_internal_test`);
            await clientA.query(`SELECT set_config('app.current_tenant', $1, false)`, [tenantA]);
            const res = await clientA.query(`SELECT id, tenant_id FROM children`);

            expect(res.rows.length).toBe(1);
            expect(res.rows[0].id).toBe(childA);
        } finally {
            clientA.release();
        }

        // VERIFY TENANT B ISOLATION
        const clientB = await pool.connect();
        try {
            await clientB.query(`SET ROLE rls_internal_test`);
            await clientB.query(`SELECT set_config('app.current_tenant', $1, false)`, [tenantB]);
            const res = await clientB.query(`SELECT id, tenant_id FROM children`);

            expect(res.rows.length).toBe(1);
            expect(res.rows[0].id).toBe(childB);
        } finally {
            clientB.release();
        }

        console.log(`${TEXT_GREEN}✅ T2: Raw SQL queries see only own tenant's data.${TEXT_RESET}`);
    });

    // T3: Prisma "Forgetfulness" Proof
    it('T3: Prisma findMany without WHERE clause is isolated', async () => {
        const results = await prisma.$transaction(async (tx) => {
            // Simulate App Logic:
            // 1. Connection acquired (tx)
            // 2. Role = rls_internal_test (using executeRawUnsafe)
            await tx.$executeRawUnsafe(`SET ROLE rls_internal_test`);

            // 3. Set Context (Middleware/Extension)
            await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantA}, true)`;

            // 4. Run "Forgetful" Query (No filter)
            return await tx.child.findMany({
                select: { id: true, tenantId: true }
            });
        });

        // Verification
        expect(results.length).toBe(1);
        expect(results[0].id).toBe(childA);
        expect(results[0].tenantId).toBe(tenantA);

        console.log(`${TEXT_GREEN}✅ T3: Prisma query without filter is strictly isolated.${TEXT_RESET}`);
    });
});
