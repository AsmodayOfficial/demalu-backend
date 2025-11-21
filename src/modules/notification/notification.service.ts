import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OneSignalService } from './one-signal.service';
import { UserLocationService } from '../location/location.service';


@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oneSignal: OneSignalService,
    private readonly locationService: UserLocationService,
  ) {}

  async sendSosSignal(userId: number) {
    // 1. Get User & Current Room
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { room: { include: { members: true } } },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Assuming 1 user = 1 room constraint
    const activeRoom = user.memberships[0]?.room;
    if (!activeRoom) {
      throw new ForbiddenException('You are not in a room. Cannot send SOS.');
    }

    // 2. Get User's Latest Location (to send in payload)
    const location = await this.locationService.getCurrentLocation(userId);

    // 3. Filter Recipients (All members EXCEPT sender)
    const recipients = activeRoom.members
      .filter((member) => member.userId !== userId)
      .map((member) => member.userId);

    if (recipients.length === 0) {
      return { message: 'No other members in the room to alert.' };
    }

    // 4. Send Push Notification via OneSignal
    await this.oneSignal.sendSos(recipients, {
      type: 'SOS',
      senderId: user.id,
      senderName: user.displayName || user.username,
      roomId: activeRoom.id,
      latitude: location ? Number(location.latitude) : undefined,
      longitude: location ? Number(location.longitude) : undefined,
    });

    // 5. Save to Database (Audit Log)
    // We create a notification record for each recipient
    await this.prisma.notification.createMany({
      data: recipients.map((recipientId) => ({
        userId: recipientId,
        actorId: userId,
        roomId: activeRoom.id,
        type: 'SOS',
        title: 'SOS ALERT!',
        body: `${user.displayName || user.username} needs help!`,
        priority: 'CRITICAL',
        deliveryStatus: 'SENT', // Assumed sent via OneSignal
        payload: {
           latitude: location ? Number(location.latitude) : null,
           longitude: location ? Number(location.longitude) : null,
        },
      })),
    });

    return { 
      sent: true, 
      recipientCount: recipients.length, 
      message: 'SOS Signal sent successfully' 
    };
  }
}