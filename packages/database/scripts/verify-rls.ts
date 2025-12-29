
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEXT_RESET = '\x1b[0m';
const TEXT_GREEN = '\x1b[32m';
const TEXT_RED = '\x1b[31m';
const TEXT_BOLD = '\x1b[1m';

async function main() {
    console.log(`${TEXT_BOLD}🔍 Verifying RLS Configuration...${TEXT_RESET}\n`);

    const requiredTables = [
        'users',
        'children',
        'rooms',
        'daily_logs',
        'attendance_records',
        'invoices',
        'invoice_items',
        'payments',
        'conversations',
        'messages',
        'announcements',
        'announcement_reads',
        'audit_logs'
    ];

    try {
        // Check Current User Privileges
        const userStatus = await prisma.$queryRawUnsafe<any[]>(`
      SELECT rolname, rolsuper, rolbypassrls 
      FROM pg_roles 
      WHERE rolname = current_user
    `);
        const user = userStatus[0];
        console.log(`👤 Current User: ${TEXT_BOLD}${user.rolname}${TEXT_RESET}`);
        console.log(`   Superuser: ${user.rolsuper ? TEXT_RED + 'YES' + TEXT_RESET : TEXT_GREEN + 'NO' + TEXT_RESET}`);
        console.log(`   Bypass RLS: ${user.rolbypassrls ? TEXT_RED + 'YES' + TEXT_RESET : TEXT_GREEN + 'NO' + TEXT_RESET}`);

        if (user.rolsuper || user.rolbypassrls) {
            console.warn(`${TEXT_RED}⚠️  WARNING: Current user is Superuser or has BypassRLS. RLS will NOT be enforced for this user even with FORCE RLS.${TEXT_RESET}\n`);
        }

        const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname IN (${requiredTables.map(t => `'${t}'`).join(',')})
      ORDER BY relname;
    `);

        // Creates a map for easier lookup
        const tableStatus = new Map(results.map((r: any) => [r.relname, r]));

        let allPass = true;

        // Print Header
        console.log('----------------------------------------------------------------');
        console.log(`| ${'Table Name'.padEnd(20)} | ${'RLS Enabled'.padEnd(12)} | ${'RLS Forced'.padEnd(12)} | ${'Status'.padEnd(8)} |`);
        console.log('----------------------------------------------------------------');

        for (const table of requiredTables) {
            const status = tableStatus.get(table);

            let rlsEnabled = false;
            let rlsForced = false;

            if (status) {
                rlsEnabled = status.relrowsecurity;
                rlsForced = status.relforcerowsecurity;
            }

            const pass = rlsEnabled && rlsForced;
            if (!pass) allPass = false;

            const rlsEnabledStr = rlsEnabled ? 'YES' : 'NO';
            const rlsForcedStr = rlsForced ? 'YES' : 'NO';
            const statusStr = pass ? `${TEXT_GREEN}PASS${TEXT_RESET}` : `${TEXT_RED}FAIL${TEXT_RESET}`;

            console.log(`| ${table.padEnd(20)} | ${rlsEnabledStr.padEnd(12)} | ${rlsForcedStr.padEnd(12)} | ${statusStr.padEnd(17)} |`);
        }

        console.log('----------------------------------------------------------------\n');

        if (allPass) {
            console.log(`${TEXT_GREEN}${TEXT_BOLD}✅ PASS: All required tables have RLS enabled and forced.${TEXT_RESET}`);
            process.exit(0);
        } else {
            console.error(`${TEXT_RED}${TEXT_BOLD}❌ FAIL: Some tables are missing RLS configuration.${TEXT_RESET}`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`${TEXT_RED}Error running verification:${TEXT_RESET}`, error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
