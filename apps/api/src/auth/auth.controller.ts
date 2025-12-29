import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Request,
    Req,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { AuthService, AuthTokens } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { JwtOnlyAllowed } from '../common/decorators/jwt-only.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private auditService: AuditService,
    ) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: LoginDto,
        @Req() req: any,
    ): Promise<AuthTokens> {
        const user = await this.authService.validateUser(
            loginDto.email,
            loginDto.password,
        );
        const tokens = await this.authService.login(user);

        // Log successful login
        await this.auditService.logLogin(user.tenantId, user.id, req);

        return tokens;
    }

    @Get('profile')
    @JwtOnlyAllowed()
    async getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.sub);
    }

    @Post('logout')
    @JwtOnlyAllowed()
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req: any) {
        const user = req.user;

        // Log logout event
        await this.auditService.logLogout(user.tenantId, user.sub, req);

        return { message: 'Logged out successfully' };
    }

    /**
     * POST /api/auth/magic-link
     * Request a magic link for passwordless login (parents)
     */
    @Public()
    @Post('magic-link')
    @HttpCode(HttpStatus.OK)
    async requestMagicLink(@Body() body: { email: string }) {
        return this.authService.sendMagicLink(body.email);
    }

    /**
     * GET /api/auth/magic-link/verify
     * Verify a magic link token and return JWT
     */
    @Public()
    @Get('magic-link/verify')
    async verifyMagicLink(
        @Query('token') token: string,
        @Req() req: any,
    ): Promise<AuthTokens> {
        const tokens = await this.authService.verifyMagicLink(token);

        // Log magic link login
        await this.auditService.logLogin(tokens.user.tenantId, tokens.user.id, req);

        return tokens;
    }
}
