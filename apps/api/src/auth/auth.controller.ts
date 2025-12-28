import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { AuthService, AuthTokens } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<AuthTokens> {
        const user = await this.authService.validateUser(
            loginDto.email,
            loginDto.password,
        );
        return this.authService.login(user);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.sub);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout() {
        // Client-side handles token removal
        // Could add token to blacklist for enhanced security
        return { message: 'Logged out successfully' };
    }

    /**
     * POST /api/auth/magic-link
     * Request a magic link for passwordless login (parents)
     */
    @Post('magic-link')
    @HttpCode(HttpStatus.OK)
    async requestMagicLink(@Body() body: { email: string }) {
        return this.authService.sendMagicLink(body.email);
    }

    /**
     * GET /api/auth/magic-link/verify
     * Verify a magic link token and return JWT
     */
    @Get('magic-link/verify')
    async verifyMagicLink(@Query('token') token: string): Promise<AuthTokens> {
        return this.authService.verifyMagicLink(token);
    }
}
