import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
    }

    async enableShutdownHooks(app: INestApplication) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }

    /**
     * Create a tenant-scoped transaction
     * Sets the app.current_tenant session variable before executing queries
     * This is required for RLS policies to work correctly
     */
    async $transactionWithTenant<T>(
        tenantId: string,
        fn: (prisma: PrismaClient) => Promise<T>
    ): Promise<T> {
        return this.$transaction(async (tx) => {
            // Set the tenant context for RLS
            await tx.$executeRawUnsafe(`SET app.current_tenant = '${tenantId}'`);
            return fn(tx as PrismaClient);
        });
    }

    /**
     * Execute a query with tenant context (for individual queries)
     * Use this when not in a transaction
     */
    async withTenantContext<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
        // Set tenant context
        await this.$executeRawUnsafe(`SET app.current_tenant = '${tenantId}'`);
        try {
            return await fn();
        } finally {
            // Reset tenant context
            await this.$executeRawUnsafe(`RESET app.current_tenant`);
        }
    }
}
