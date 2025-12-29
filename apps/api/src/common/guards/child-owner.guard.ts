/**
 * Child Owner Guard
 * 
 * Ensures that PARENT users can only access their own children's data.
 * This guard extracts the childId from the route params and validates
 * that the authenticated parent is linked to that child.
 */
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChildOwnerGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Only enforce for PARENT role
        if (user?.role !== UserRole.PARENT) {
            return true;
        }

        // Get childId from route params
        const childId = request.params.childId;
        if (!childId) {
            // No childId in route, nothing to check
            return true;
        }

        // Verify the parent is linked to this child via guardian relationship
        const isLinked = await this.isParentLinkedToChild(user.sub, childId, user.tenantId);

        if (!isLinked) {
            throw new ForbiddenException(
                'You do not have access to this child\'s information'
            );
        }

        return true;
    }

    /**
     * Check if a parent user is linked to a specific child
     * via the Guardian -> ChildGuardian relationship
     */
    private async isParentLinkedToChild(
        userId: string,
        childId: string,
        tenantId: string
    ): Promise<boolean> {
        // Find guardian record for this user
        const guardian = await this.prisma.guardian.findFirst({
            where: {
                userId: userId,
                tenantId: tenantId,
            },
            select: { id: true },
        });

        if (!guardian) {
            return false;
        }

        // Check if this guardian is linked to the child
        const link = await this.prisma.childGuardian.findFirst({
            where: {
                guardianId: guardian.id,
                childId: childId,
            },
        });

        return !!link;
    }
}
