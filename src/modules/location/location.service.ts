import {
  Injectable,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserLocationDto } from './location.dto';

@Injectable()
export class UserLocationService {
  private readonly logger = new Logger(UserLocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // RECORD NEW LOCATION
  // ---------------------------------------------------------
  async create(userId: number, dto: CreateUserLocationDto) {
    try {
      // Use a transaction to Ensure only ONE location is marked "isCurrent" at a time
      return await this.prisma.$transaction(async (tx) => {
        // 1. Mark all previous current locations as historical (false)
        await tx.userLocation.updateMany({
          where: { userId, isCurrent: true },
          data: { isCurrent: false },
        });

        // 2. Create the new location entry as current
        const newLocation = await tx.userLocation.create({
          data: {
            userId,
            latitude: dto.latitude,
            longitude: dto.longitude,
            accuracy: dto.accuracy,
            isCurrent: true,
          },
        });

        return newLocation;
      });
    } catch (error) {
      this.logger.error(`Failed to record location for user ${userId}`, error.stack);
      throw new InternalServerErrorException(`Failed to record location: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // GET CURRENT LOCATION
  // ---------------------------------------------------------
  async getCurrentLocation(userId: number) {
    try {
      return await this.prisma.userLocation.findFirst({
        where: { userId, isCurrent: true },
        orderBy: { recordedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to get current location for user ${userId}`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch current location: ${error.message}`);
    }
  }
async getRoomMemberLocations(roomId: number, currentUserId: number) {
    try {
      return await this.prisma.userLocation.findMany({
        where: {
          isCurrent: true, // Only fetch the active location
           userId: { not: currentUserId },
          user: {
            memberships: {
              some: { roomId },
            },
          },
        },
        // Explicitly ensure we get one record per user (the latest)
        distinct: ['userId'],
        orderBy: { recordedAt: 'desc' },
        select: {
          latitude: true,
          longitude: true,
          accuracy: true,
          recordedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch room locations`, error.stack);
      return []; 
    }
  }
  // ---------------------------------------------------------
  // GET LOCATION HISTORY
  // ---------------------------------------------------------
  async getLocationHistory(userId: number) {
    try {
      return await this.prisma.userLocation.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: 50, // Limit to last 50 points to prevent overloading
      });
    } catch (error) {
      this.logger.error(`Failed to get location history for user ${userId}`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch location history: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // DELETE HISTORY (Cleanup)
  // ---------------------------------------------------------
  async deleteHistory(userId: number) {
    try {
        // Keep the current one, delete others? Or delete all? 
        // Typically delete all except current is safer logic, or delete all.
        // Here we delete ALL for privacy requests.
        return await this.prisma.userLocation.deleteMany({
            where: { userId }
        });
    } catch (error) {
        this.logger.error(`Failed to delete history for user ${userId}`, error.stack);
        throw new InternalServerErrorException(`Failed to delete history: ${error.message}`);
    }
  }
}