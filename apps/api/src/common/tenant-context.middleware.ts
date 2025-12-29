/**
 * Tenant Context Middleware
 * 
 * Sets the tenant context from JWT after authentication.
 * This middleware must run AFTER the JWT authentication.
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { runWithTenantContext } from './tenant-context';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

// Extend Express Request to include user from JWT
interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        email: string;
        tenantId: string;
        role: string;
        permissions: string[];
    };
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        // Extract token from header
        const authHeader = req.headers.authorization;
        console.log(`[Middleware] AuthHeader: ${authHeader ? 'Present' : 'Missing'}`);

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                // Decode token to get tenantId (without verification - guard handles verification later)
                // We just need the tenantId to set up RLS so the guard can actually verify the user exists
                const payload = this.jwtService.decode(token) as any;
                console.log(`[Middleware] Decoded Payload Tenant: ${payload?.tenantId}`);

                if (payload && payload.tenantId) {
                    // Set the tenant context in AsyncLocalStorage
                    if (process.env.TENANT_DEBUG === 'true') {
                        console.log(`[RLS-DEBUG] Request ${req.path}, Tenant: ${payload.tenantId}`);
                    }
                    runWithTenantContext(
                        {
                            tenantId: payload.tenantId,
                            userId: payload.sub,
                            role: payload.role,
                        },
                        async () => {
                            // RLS is handled by Prisma Client Extension checking ALS
                            next();
                        }
                    );
                    return;
                }
            } catch (error) {
                // If decoding fails, just proceed without context - guard will handle 401/403
            }
        }

        // For unauthenticated requests or failed decoding, proceed without context
        next();
    }
}
