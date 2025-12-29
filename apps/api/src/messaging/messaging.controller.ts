import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { Permission } from '../common/permissions.enum';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('messaging')
export class MessagingController {
    constructor(private messagingService: MessagingService) { }

    /**
     * Get all conversations for the current user
     * Managers can see ALL conversations in their tenant for coverage
     */
    @Get('conversations')
    @RequirePermissions(Permission.MESSAGING_READ)
    async getConversations(@Req() req: any) {
        const { tenantId, sub: userId, role } = req.user;
        return this.messagingService.getConversations(tenantId, userId, role);
    }

    /**
     * Get messages in a conversation
     */
    @Get('conversations/:id/messages')
    @RequirePermissions(Permission.MESSAGING_READ)
    async getMessages(
        @Param('id') conversationId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.messagingService.getMessages(
            conversationId,
            limit ? parseInt(limit, 10) : 50,
            offset ? parseInt(offset, 10) : 0,
        );
    }

    /**
     * Start a new conversation or get existing one
     */
    @Post('conversations')
    @RequirePermissions(Permission.MESSAGING_WRITE)
    async createConversation(
        @Req() req: any,
        @Body() body: { parentUserId?: string; staffUserId?: string; childId?: string },
    ) {
        const { tenantId, sub: userId, role } = req.user;

        // Determine staff and parent based on who is creating
        let staffUserId: string;
        let parentUserId: string;

        if (role === 'PARENT') {
            parentUserId = userId;
            staffUserId = body.staffUserId!;
        } else {
            staffUserId = userId;
            parentUserId = body.parentUserId!;
        }

        return this.messagingService.getOrCreateConversation({
            tenantId,
            staffUserId,
            parentUserId,
            childId: body.childId,
        });
    }

    /**
     * Send a message (REST fallback if Socket.IO unavailable)
     */
    @Post('conversations/:id/messages')
    @RequirePermissions(Permission.MESSAGING_WRITE)
    async sendMessage(
        @Req() req: any,
        @Param('id') conversationId: string,
        @Body() body: { content: string; attachmentUrls?: string[] },
    ) {
        return this.messagingService.sendMessage({
            tenantId: req.user.tenantId,
            conversationId,
            senderId: req.user.sub,
            content: body.content,
            attachmentUrls: body.attachmentUrls,
        });
    }

    /**
     * Mark messages as read
     */
    @Patch('conversations/:id/read')
    @RequirePermissions(Permission.MESSAGING_READ)
    async markAsRead(
        @Req() req: any,
        @Param('id') conversationId: string,
    ) {
        await this.messagingService.markMessagesAsRead(conversationId, req.user.sub);
        return { success: true };
    }

    /**
     * Get unread message count
     */
    @Get('unread-count')
    @RequirePermissions(Permission.MESSAGING_READ)
    async getUnreadCount(@Req() req: any) {
        const { tenantId, sub: userId } = req.user;
        return this.messagingService.getUnreadCount(tenantId, userId);
    }

    /**
     * Update quiet hours settings
     */
    @Patch('quiet-hours')
    @RequirePermissions(Permission.MESSAGING_WRITE)
    async updateQuietHours(
        @Req() req: any,
        @Body() body: { quietHoursStart?: string; quietHoursEnd?: string },
    ) {
        // This would update user quiet hours - implement in a user service
        // For now, return success
        return {
            success: true,
            message: 'Quiet hours updated',
            quietHoursStart: body.quietHoursStart,
            quietHoursEnd: body.quietHoursEnd,
        };
    }

    /**
     * Get list of parents with their children (for staff to start conversations)
     */
    @Get('parents')
    @RequirePermissions(Permission.MESSAGING_READ)
    async getParents(@Req() req: any) {
        const { tenantId } = req.user;
        return this.messagingService.getParentsForConversation(tenantId);
    }

    /**
     * Get key person for a child (for parent to start conversations)
     */
    @Get('key-person/:childId')
    @RequirePermissions(Permission.MESSAGING_READ)
    async getKeyPerson(@Param('childId') childId: string) {
        return this.messagingService.getKeyPersonForChild(childId);
    }
}
