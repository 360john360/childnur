
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { AuthService } from './../src/auth/auth.service';
import { UserRole } from '@prisma/client';
import { Permission } from './../src/common/permissions.enum';
import { JwtOnlyAllowed } from './../src/common/decorators/jwt-only.decorator';

// Define a Dummy Controller to test Global Guard behavior on UNGUARDED routes
@Controller('test-unguarded')
class UnguardedController {
    @Get('fail')
    fail() { return { status: 'unsafe' }; }

    @Get('pass')
    @JwtOnlyAllowed()
    pass() { return { status: 'safe' }; }
}

describe('RBAC Hardening (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;

    let tenantId: string;

    // Tokens
    let managerToken: string;
    let practitionerToken: string;
    let parentToken: string;

    beforeAll(async () => {
        // Register the UnguardedController for testing purposes
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
            controllers: [UnguardedController],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        authService = moduleFixture.get<AuthService>(AuthService);

        // 1. Setup Tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: 'RBAC Test Tenant',
                subdomain: `rbac-test-${Date.now()}`,
            },
        });
        tenantId = tenant.id;

        // 2. Create Users
        const manager = await prisma.user.create({
            data: {
                email: `manager-${Date.now()}@test.com`,
                tenantId: tenant.id,
                role: UserRole.MANAGER,
                firstName: 'Manager',
                lastName: 'User',
            },
        });

        const practitioner = await prisma.user.create({
            data: {
                email: `practitioner-${Date.now()}@test.com`,
                tenantId: tenant.id,
                role: UserRole.PRACTITIONER,
                firstName: 'Practitioner',
                lastName: 'User',
            },
        });

        const parent = await prisma.user.create({
            data: {
                email: `parent-${Date.now()}@test.com`,
                tenantId: tenant.id,
                role: UserRole.PARENT,
                firstName: 'Parent',
                lastName: 'User',
            },
        });

        // 3. Generate Tokens
        const managerTokens = await authService.login(manager);
        managerToken = managerTokens.accessToken;

        const practitionerTokens = await authService.login(practitioner);
        practitionerToken = practitionerTokens.accessToken;

        const parentTokens = await authService.login(parent);
        parentToken = parentTokens.accessToken;
    });

    afterAll(async () => {
        await prisma.tenant.delete({ where: { id: tenantId } });
        await app.close();
    });

    describe('Regression: Specific Endpoint Permissions', () => {
        it('POST /announcements: Practitioner (Read-Only) -> 403', async () => {
            return request(app.getHttpServer())
                .post('/announcements')
                .set('Authorization', `Bearer ${practitionerToken}`)
                .send({ title: 'Hack', content: 'Fail' })
                .expect(403);
        });

        it('POST /attendance/bulk-check-in: Practitioner (Write) -> 201', async () => {
            // Need child first
            const child = await prisma.child.create({
                data: { tenantId, firstName: 'T', lastName: 'C', dateOfBirth: new Date() }
            });

            return request(app.getHttpServer())
                .post('/attendance/bulk-check-in')
                .set('Authorization', `Bearer ${practitionerToken}`)
                .send({ childIds: [child.id] })
                .expect(201);
        });
    });

    describe('Global Default Deny Policy', () => {
        it('Should DENY access to a route with NO decorators (Default Deny)', async () => {
            return request(app.getHttpServer())
                .get('/test-unguarded/fail')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403)
                .expect((res) => {
                    expect(res.body.message).toContain('No permissions metadata configured');
                });
        });

        it('Should ALLOW access to a route with @JwtOnlyAllowed', async () => {
            return request(app.getHttpServer())
                .get('/test-unguarded/pass')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200)
                .expect({ status: 'safe' });
        });
    });

    describe('ChildrenController (Newly Secured)', () => {
        it('GET /children: Parent (Read Allowed) -> 200', async () => {
            return request(app.getHttpServer())
                .get('/children')
                .set('Authorization', `Bearer ${parentToken}`)
                .expect(200);
        });

        // Parent does NOT have permission to view stats (only CHILD_READ)
        // Wait, PermissionsGuard combines role + user permissions.
        // PARENT has CHILD_READ.
        // endpoint GET /children/stats requires CHILD_READ?
        // Let's check ChildrenController
        // yes @RequirePermissions(Permission.CHILD_READ)
        // So Parent can read stats?
        // Actually, Parent role SHOULD have CHILD_READ.
        // Let's verify if Parent has CHILD_READ.
        // Yes, default role PARENT has [CHILD_READ,...].
        // But wait, stats might be sensitive? 
        // For now, testing that RBAC works.
        // Let's test non-permissioned role? 
        // We lack a "No Permission" role.
        // Let's use Practitioner for a Write endpoint checks.
    });
});
