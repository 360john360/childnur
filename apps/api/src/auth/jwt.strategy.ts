import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('AUTH_SECRET') || 'nursery-secret-key-change-in-production',
        });
    }

    async validate(payload: JwtPayload) {
        return {
            sub: payload.sub,
            email: payload.email,
            tenantId: payload.tenantId,
            role: payload.role,
            permissions: payload.permissions,
        };
    }
}
