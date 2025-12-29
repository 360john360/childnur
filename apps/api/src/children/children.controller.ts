import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ChildrenService } from './children.service';
import { Permission } from '../common/permissions.enum';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ChildStatus } from '@prisma/client';

@Controller('children')
export class ChildrenController {
    constructor(private childrenService: ChildrenService) { }

    @Get()
    @RequirePermissions(Permission.CHILD_READ)
    async findAll(
        @Request() req: any,
        @Query('roomId') roomId?: string,
        @Query('status') status?: ChildStatus,
        @Query('search') search?: string,
    ) {
        return this.childrenService.findAll(req.user.tenantId, {
            roomId,
            status,
            search,
        });
    }

    @Get('stats')
    @RequirePermissions(Permission.CHILD_READ)
    async getStats(@Request() req: any) {
        return this.childrenService.getDashboardStats(req.user.tenantId);
    }

    @Get('allergies')
    @RequirePermissions(Permission.CHILD_READ)
    async getAllergies(@Request() req: any) {
        return this.childrenService.getWithAllergies(req.user.tenantId);
    }

    @Get('rooms')
    @RequirePermissions(Permission.CHILD_READ)
    async getRooms(@Request() req: any) {
        return this.childrenService.getRooms(req.user.tenantId);
    }

    @Get('room/:roomId')
    @RequirePermissions(Permission.CHILD_READ)
    async findByRoom(@Request() req: any, @Param('roomId') roomId: string) {
        return this.childrenService.findByRoom(roomId, req.user.tenantId);
    }

    @Get('guardians')
    @RequirePermissions(Permission.CHILD_READ)
    async getGuardians(@Request() req: any) {
        return this.childrenService.getGuardians(req.user.tenantId);
    }

    @Get(':id')
    @RequirePermissions(Permission.CHILD_READ)
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.childrenService.findOne(id, req.user.tenantId);
    }
}
