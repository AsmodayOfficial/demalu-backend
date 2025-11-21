import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RoomService } from '../room/room.service';
import { UserLocationService } from './location.service';
import { CreateUserLocationDto } from './location.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'locations',
})
export class UserLocationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UserLocationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly locationService: UserLocationService,
    private readonly roomService: RoomService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new UnauthorizedException('No token provided');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data.user = payload;
      this.logger.verbose(`Client connected: ${payload.sub}`);

      // 2. Auto-join Room & Send Initial State
      const room = await this.roomService.getMyRoom(payload.sub);
      
      if (room) {
        const roomChannel = `room_${room.id}`;
        await client.join(roomChannel);
        client.data.roomId = room.id;

        // --- NEW: Fetch and send locations of other members ---
        const memberLocations = await this.locationService.getRoomMemberLocations(room.id, payload.sub);
        console.log('memberLocations', memberLocations)
        
        // Emit only to the connecting client
        client.emit('initialRoomLocations', memberLocations);
        
        this.logger.log(`Sent ${memberLocations.length} locations to user ${payload.sub}`);
      }

    } catch (e) {
      this.logger.error(`Connection rejected: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client verbose: ${client.id}`);
  }

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateUserLocationDto,
  ) {
    const user = client.data.user;
    if (!user) return;

    // Save to DB
    await this.locationService.create(user.sub, dto);
    
    // Broadcast to Room
    const roomId = client.data.roomId;
    if (roomId) {
      client.to(`room_${roomId}`).emit('memberLocationUpdated', {
        userId: user.sub,
        username: user.username,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        updatedAt: new Date(),
      });
    }
  }

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake.auth?.token;
    if (auth) return auth;
    const header = client.handshake.headers.authorization;
    if (header) {
      const [type, token] = header.split(' ');
      return type === 'Bearer' ? token : undefined;
    }
    return undefined;
  }
}