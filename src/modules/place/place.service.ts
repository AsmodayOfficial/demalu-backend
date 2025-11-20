import { 
  Injectable, 
  NotFoundException, 
  InternalServerErrorException, 
  HttpException,
  Logger // Import Logger
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePlaceDto, UpdatePlaceDto, SearchNearbyDto } from './place.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlaceService {
  private readonly logger = new Logger(PlaceService.name); // Initialize Logger

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------
  async create(dto: CreatePlaceDto) {
    try {
      return await this.prisma.place.create({
        data: {
          name: dto.name,
          description: dto.description,
          category: dto.category,
          googlePlaceId: dto.googlePlaceId,
          coverImage: dto.coverImage,
          images: dto.images || [],
          address: dto.address,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });
    } catch (error) {
      this.logger.error(`Create Place failed`, error.stack);
      if (error.code === 'P2002') {
        throw new InternalServerErrorException('Place already exists (Duplicate ID).');
      }
      throw new InternalServerErrorException(`Failed to create place: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // FIND ALL (with Search)
  // ---------------------------------------------------------
  async findAll(query?: string, category?: string) {
    try {
      const where: Prisma.PlaceWhereInput = {};

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = { equals: category, mode: 'insensitive' };
      }

      return await this.prisma.place.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Find All Places failed`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch places: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // FIND NEARBY (Geospatial)
  // ---------------------------------------------------------
  async findNearby(dto: SearchNearbyDto) {
    try {
      const { latitude, longitude, radius = 5 } = dto;

      const rawPlaces = await this.prisma.$queryRaw`
        SELECT id, name, description, category, "coverImage", latitude, longitude,
        (6371 * acos(
          cos(radians(${Number(latitude)})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${Number(longitude)})) +
          sin(radians(${Number(latitude)})) * sin(radians(latitude))
        )) AS distance
        FROM "Place"
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND (6371 * acos(
          cos(radians(${Number(latitude)})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${Number(longitude)})) +
          sin(radians(${Number(latitude)})) * sin(radians(latitude))
        )) < ${Number(radius)}
        ORDER BY distance ASC
        LIMIT 50;
      `;

      return rawPlaces;
    } catch (error) {
      this.logger.error(`Find Nearby Places failed`, error.stack);
      throw new InternalServerErrorException(`Failed to search nearby places: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // FIND ONE
  // ---------------------------------------------------------
  async findOne(id: number) {
    try {
      const place = await this.prisma.place.findUnique({
        where: { id },
        include: {
          reviews: { select: { rating: true, comment: true, author: { select: { username: true } } } },
          _count: { select: { reviews: true, rooms: true } },
        },
      });

      if (!place) throw new NotFoundException(`Place with ID ${id} not found`);
      return place;
    } catch (error) {
      this.logger.error(`Find One Place failed for ID ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to fetch place: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------
  async update(id: number, dto: UpdatePlaceDto) {
    try {
      await this.findOne(id); 

      return await this.prisma.place.update({
        where: { id },
        data: { ...dto },
      });
    } catch (error) {
      this.logger.error(`Update Place failed for ID ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to update place: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // REMOVE
  // ---------------------------------------------------------
  async remove(id: number) {
    try {
      await this.findOne(id); 
      return await this.prisma.place.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Remove Place failed for ID ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to delete place: ${error.message}`);
    }
  }
}