import { Controller, Post, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/service/jwt.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('sos')
  @HttpCode(200)
  @ApiOperation({ summary: 'Trigger an SOS signal to all room members' })
  @ApiResponse({ status: 200, description: 'SOS sent successfully.' })
  @ApiResponse({ status: 403, description: 'User not in a room.' })
  async sendSos(@Request() req) {
    const userId = req.user?.id;
    return this.notificationService.sendSosSignal(userId);
  }
}