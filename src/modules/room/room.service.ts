import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
  Logger, // Import Logger
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GeoUtils } from '../../common/utils/geo.utils';
import { CreateRoomDto, JoinRoomDto } from './create-room.dto';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name); // Initialize Logger

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------
  async createRoom(userId: number, dto: CreateRoomDto) {
    try {
      // ... existing logic ...
      await this.ensureUserIsNotInRoom(userId);

      const pin = await this.generateUniquePin();

      let { latitude, longitude } = dto;

      if (dto.maxDistance && (!latitude || !longitude)) {
        const userLoc = await this.getLastUserLocation(userId);
        if (userLoc) {
          latitude = Number(userLoc.latitude);
          longitude = Number(userLoc.longitude);
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        const room = await tx.room.create({
          data: {
            name: dto.name || `Room ${pin}`,
            description: dto.description,
            isPrivate: dto.isPrivate ?? false,
            maxMembers: dto.maxMembers,
            maxDistance: dto.maxDistance,
            pin: pin,
            latitude: latitude,
            longitude: longitude,
            createdById: userId,
          },
        });

        await tx.roomMember.create({
          data: {
            userId,
            roomId: room.id,
            role: 'OWNER',
          },
        });

        return room;
      });
    } catch (error) {
      this.logger.error(`Create Room failed for user ${userId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to create room: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // JOIN (By PIN)
  // ---------------------------------------------------------
  async joinRoomByPin(userId: number, dto: JoinRoomDto) {
    try {
      // ... existing logic ...
      await this.ensureUserIsNotInRoom(userId);

      const room = await this.prisma.room.findUnique({
        where: { pin: dto.pin },
        include: { members: true },
      });

      if (!room) {
        throw new NotFoundException('Invalid PIN. Room not found.');
      }

      if (room.maxMembers && room.members.length >= room.maxMembers) {
        throw new ForbiddenException('Room is full.');
      }

      if (room.maxDistance && room.latitude && room.longitude) {
        await this.validateUserLocation(
          userId,
          room.latitude,
          room.longitude,
          room.maxDistance,
        );
      }

      return await this.prisma.roomMember.create({
        data: {
          userId,
          roomId: room.id,
          role: 'MEMBER',
        },
        include: { room: true },
      });
    } catch (error) {
      this.logger.error(`Join Room failed for user ${userId} pin ${dto.pin}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to join room: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // LEAVE
  // ---------------------------------------------------------
  async leaveRoom(userId: number) {
    try {
      const membership = await this.prisma.roomMember.findUnique({
        where: { userId },
        include: { room: true },
      });

      if (!membership) {
        throw new NotFoundException('You are not currently in a room.');
      }

      await this.prisma.roomMember.delete({
        where: { userId },
      });

      return { message: `Left room ${membership.room.name || membership.room.pin}` };
    } catch (error) {
      this.logger.error(`Leave Room failed for user ${userId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to leave room: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // GET MY ROOM
  // ---------------------------------------------------------
  async getMyRoom(userId: number) {
    try {
      const membership = await this.prisma.roomMember.findUnique({
        where: { userId },
        include: {
          room: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!membership) return null;
      return membership.room;
    } catch (error) {
      this.logger.error(`Get My Room failed for user ${userId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to fetch room details: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // GET ALL PUBLIC ROOMS
  // ---------------------------------------------------------
  async getPublicRooms() {
    try {
      const rooms = await this.prisma.room.findMany({
        where: {
          isPrivate: false,
        },
        include: {
          _count: {
            select: { members: true },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return rooms.map((room) => ({
        ...room,
        countMembers: room._count.members,
      }));
    } catch (error) {
      this.logger.error(`Get Public Rooms failed`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch public rooms: ${error.message}`);
    }
  }

  // ... existing helpers ...
  private async ensureUserIsNotInRoom(userId: number) {
    const existing = await this.prisma.roomMember.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(
        'You are already in a room. You must leave it first.',
      );
    }
  }

  private async generateUniquePin(): Promise<string> {
    let isUnique = false;
    let pin = '';
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await this.prisma.room.findUnique({ where: { pin } });
      if (!exists) isUnique = true;
      attempts++;
    }
    if (!isUnique) throw new InternalServerErrorException('Failed to generate unique PIN');
    return pin;
  }

  private async getLastUserLocation(userId: number) {
    return this.prisma.userLocation.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  private async validateUserLocation(
    userId: number,
    roomLat: any,
    roomLng: any,
    maxKm: number,
  ) {
    const userLoc = await this.getLastUserLocation(userId);
    if (!userLoc) return;
    const distance = GeoUtils.getDistanceInKm(
      userLoc.latitude,
      userLoc.longitude,
      roomLat,
      roomLng,
    );
    if (distance > maxKm) {
      throw new ForbiddenException(
        `You are too far away! (${distance.toFixed(2)}km). Max allowed: ${maxKm}km.`,
      );
    }
  }
}