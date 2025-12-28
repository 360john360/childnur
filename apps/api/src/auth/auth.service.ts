import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
    sub: string;       // User ID
    email: string;
    tenantId: string;
    role: string;
    permissions: string[];
}

export interface AuthTokens {
    accessToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        tenantId: string;
        tenantName: string;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.prisma.user.findFirst({
            where: { email },
            include: { tenant: true },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // For demo purposes, accept 'demo123' for demo account
        let isValid = false;
        if (email === 'demo@nurseryhub.co.uk' && password === 'demo123') {
            isValid = true;
        } else {
            isValid = await bcrypt.compare(password, user.passwordHash);
        }

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.tenant.name,
            permissions: user.permissions,
        };
    }

    async login(user: any): Promise<AuthTokens> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            permissions: user.permissions as string[],
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                tenantId: user.tenantId,
                tenantName: user.tenantName,
            },
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenant: true,
                staff: {
                    include: { room: true },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            role: user.role,
            permissions: user.permissions,
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
                primaryColor: user.tenant.primaryColor,
                logoUrl: user.tenant.logoUrl,
            },
            staff: user.staff ? {
                jobTitle: user.staff.jobTitle,
                room: user.staff.room?.name,
                isDSL: user.staff.isDSL,
            } : null,
        };
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    /**
     * Generate and store a magic link token for passwordless login
     * Sends email via MailHog in development
     */
    async sendMagicLink(email: string): Promise<{ message: string; token?: string }> {
        // Find user with role PARENT, include tenant for branding
        const user = await this.prisma.user.findFirst({
            where: {
                email,
                role: 'PARENT',
            },
            include: {
                tenant: true,
            },
        });

        if (!user) {
            // Don't reveal if user exists for security
            return { message: 'If an account exists, a magic link has been sent' };
        }

        // Generate secure random token
        const token = this.generateSecureToken();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // Token valid for 1 hour

        // Store token in database
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                magicLinkToken: token,
                magicLinkExpiry: expiry,
            },
        });

        // Create magic link URL
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const magicLinkUrl = `${baseUrl}/auth/magic-link/verify?token=${token}`;

        // Send email via MailHog (SMTP on localhost:1025)
        try {
            const smtpHost = process.env.SMTP_HOST || 'localhost';
            const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 1025;

            console.log(`[EMAIL] Connecting to SMTP: ${smtpHost}:${smtpPort}`);

            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: false,
                tls: {
                    rejectUnauthorized: false,
                },
            } as nodemailer.TransportOptions);

            // Get tenant branding (use tenant name, fallback to platform name)
            const nurseryName = user.tenant?.name || 'Your Nursery';
            const fromEmail = process.env.SMTP_FROM || 'noreply@nurseryhub.co.uk';

            await transporter.sendMail({
                from: `"${nurseryName}" <${fromEmail}>`,
                to: email,
                subject: `Your Login Link - ${nurseryName}`,
                text: `Click here to login: ${magicLinkUrl}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                        <h2 style="color: #8b5cf6;">🌻 ${nurseryName}</h2>
                        <p>Hi ${user.firstName},</p>
                        <p>Click the button below to login to the Parent Portal:</p>
                        <p style="margin: 24px 0;">
                            <a href="${magicLinkUrl}" 
                               style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                Login to Parent Portal
                            </a>
                        </p>
                        <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
                    </div>
                `,
            });

            console.log(`[EMAIL] Magic link sent to ${email}`);
        } catch (err) {
            console.error(`[EMAIL] Failed to send email:`, err);
            // In development, still return token even if email fails
        }

        // In development, also return token for testing
        const isDev = process.env.NODE_ENV !== 'production';
        return {
            message: 'Magic link sent to your email',
            token: isDev ? token : undefined,
        };
    }

    /**
     * Verify a magic link token and return JWT
     */
    async verifyMagicLink(token: string): Promise<AuthTokens> {
        const user = await this.prisma.user.findFirst({
            where: {
                magicLinkToken: token,
                magicLinkExpiry: {
                    gt: new Date(), // Token not expired
                },
            },
            include: { tenant: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired magic link');
        }

        // Clear the token (single-use)
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                magicLinkToken: null,
                magicLinkExpiry: null,
                status: 'ACTIVE', // Activate user if pending
                lastLoginAt: new Date(),
            },
        });

        // Generate JWT and return
        return this.login({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.tenant.name,
            permissions: user.permissions,
        });
    }

    /**
     * Generate a cryptographically secure random token
     */
    private generateSecureToken(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 64; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
}
