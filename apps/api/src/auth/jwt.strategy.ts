import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        const secret = config.get<string>('AUTH_SECRET');
        const nodeEnv = config.get<string>('NODE_ENV') || 'development';

        // Fail fast if AUTH_SECRET is not set in production
        if (!secret && nodeEnv === 'production') {
            throw new Error(
                'AUTH_SECRET environment variable is required in production. ' +
                'Set AUTH_SECRET in your .env file or environment variables.'
            );
        }

        // In development, use a default (but warn)
        const finalSecret = secret || 'nursery-secret-key-change-in-production';
        if (!secret && nodeEnv !== 'production') {
            console.warn(
                '⚠️  WARNING: AUTH_SECRET not set. Using default development secret. ' +
                'Set AUTH_SECRET in your .env file for security.'
            );
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: finalSecret,
        });
    }

    async validate(payload: JwtPayload) {
        console.log(`[JwtStrategy] Validating payload for user: ${payload.sub}`);
        return {
            sub: payload.sub,
            email: payload.email,
            tenantId: payload.tenantId,
            role: payload.role,
            permissions: payload.permissions,
        };
    }
}
