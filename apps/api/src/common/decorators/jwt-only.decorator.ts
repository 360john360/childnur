
import { SetMetadata } from '@nestjs/common';

export const IS_JWT_ONLY_ALLOWED_KEY = 'isJwtOnlyAllowed';
/**
 * Decorator to explicitly allow access with just a valid JWT, 
 * bypassing specific permission checks.
 * Use this as an escape hatch for legacy read endpoints.
 */
export const JwtOnlyAllowed = () => SetMetadata(IS_JWT_ONLY_ALLOWED_KEY, true);
