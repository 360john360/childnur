import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { getTenantIdOptional } from '../common/tenant-context';

/**
 * Extended PrismaClient with automatic tenant context injection
 * 
 * This service automatically sets the PostgreSQL session variable `app.current_tenant`
 * before each query, enabling Row-Level Security (RLS) at the database layer.
 * 
 * The tenant ID is obtained from AsyncLocalStorage (set by TenantContextMiddleware).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private _extendedClient: any;

    constructor() {
        super();
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                const keysToKeep = [
                    'onModuleInit',
                    'enableShutdownHooks',
                    'setTenantContext',
                    'clearTenantContext',
                    '$transactionWithTenant',
                    'withTenantContext',
                    'ensureTenantContext',
                    'runUnsafe',
                    'client',
                    '_extendedClient',
                    'then',
                    'catch',
                    'finally'
                ];

                if (typeof prop === 'string' && keysToKeep.includes(prop)) {
                    return Reflect.get(target, prop, receiver);
                }

                if (target._extendedClient && (prop as string) in target._extendedClient) {
                    return target._extendedClient[prop];
                }

                return Reflect.get(target, prop, receiver);
            }
        });
    }

    async onModuleInit() {
        await this.$connect();
        const service = this;

        // Create an extended client that automatically sets RLS context
        this._extendedClient = this.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        const tenantId = getTenantIdOptional();

                        console.log(`[PrismaExtension] Op: ${model}.${operation}, TenantId: ${tenantId || 'NONE'}`);

                        // If no tenant context, proceed normally
                        if (!tenantId) {
                            return query(args);
                        }

                        // Wrap the query in a transaction to set the session variable for this specific connection
                        return (service as any).$transaction(async (tx: any) => {
                            if (process.env.TENANT_DEBUG === 'true') {
                                console.log(`[RLS-DEBUG] set_config('app.current_tenant', ${tenantId})`);
                            }
                            await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
                            return query(args);
                        });
                    },
                },
            },
        });
    }

    async enableShutdownHooks(app: INestApplication) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }

    // Proxy all calls to the extended client
    get client() {
        if (!this._extendedClient) {
            return this;
        }
        return this._extendedClient;
    }

    // Deprecated helpers - no longer needed with extension but kept for compatibility
    async setTenantContext(tenantId: string): Promise<void> {
        // No-op - extension handles it
    }

    async clearTenantContext(): Promise<void> {
        // No-op
    }

    async $transactionWithTenant<T>(
        tenantId: string,
        fn: (prisma: Prisma.TransactionClient) => Promise<T>
    ): Promise<T> {
        return this.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
            return fn(tx);
        });
    }

    async withTenantContext<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
        return fn();
    }

    /**
     * Ensure tenant context is set before performing operations
     * This is called automatically if using the middleware
     */
    async ensureTenantContext(): Promise<void> {
        const tenantId = getTenantIdOptional();
        if (tenantId) {
            // No-op
        }
    }

    /**
     * Run a function with RLS bypassed (System Mode)
     * Use EXTREMELY carefully - only for login/system tasks
     */
    async runUnsafe<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
        // We use the raw transaction to set the local variable
        // We cast 'this' to any to access standard $transaction instead of extended one if needed,
        // but extended one is fine too.
        // Important: we need to use a transaction so the 'set_config' applies to the queries inside.
        return this.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
            return fn(tx as unknown as PrismaClient);
        });
    }
}
