import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
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
}
