import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ChildrenService } from './children.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChildStatus } from '@prisma/client';

@Controller('children')
@UseGuards(JwtAuthGuard)
export class ChildrenController {
    constructor(private childrenService: ChildrenService) { }

    @Get()
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
    async getStats(@Request() req: any) {
        return this.childrenService.getDashboardStats(req.user.tenantId);
    }

    @Get('allergies')
    async getAllergies(@Request() req: any) {
        return this.childrenService.getWithAllergies(req.user.tenantId);
    }

    @Get('rooms')
    async getRooms(@Request() req: any) {
        return this.childrenService.getRooms(req.user.tenantId);
    }

    @Get('room/:roomId')
    async findByRoom(@Request() req: any, @Param('roomId') roomId: string) {
        return this.childrenService.findByRoom(roomId, req.user.tenantId);
    }

    @Get('guardians')
    async getGuardians(@Request() req: any) {
        return this.childrenService.getGuardians(req.user.tenantId);
    }

    @Get(':id')
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.childrenService.findOne(id, req.user.tenantId);
    }
}
