import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCountryDto, UpdateCountryDto, CreateCityDto, UpdateCityDto } from './country.dto';

@Injectable()
export class RegionService {
  private readonly logger = new Logger(RegionService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================================================================
  // COUNTRY OPERATIONS
  // ==================================================================

  async createCountry(dto: CreateCountryDto) {
    try {
      return await this.prisma.country.create({
        data: {
          name: dto.name,
          rank: dto.rank,
          isoCode: dto.isoCode?.toUpperCase(),
        },
      });
    } catch (error) {
      this.logger.error(`Create Country failed: ${dto.name}`, error.stack);
      if (error.code === 'P2002') {
        throw new InternalServerErrorException('Country name or ISO code already exists.');
      }
      throw new InternalServerErrorException(`Failed to create country: ${error.message}`);
    }
  }

  async findAllCountries() {
    try {
      return await this.prisma.country.findMany({
        orderBy: { rank: 'asc' }, // Rank 1 shows first
        include: {
          _count: { select: { cities: true } },
        },
      });
    } catch (error) {
      this.logger.error(`Find All Countries failed`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch countries: ${error.message}`);
    }
  }

  async findOneCountry(id: number) {
    try {
      const country = await this.prisma.country.findUnique({
        where: { id },
        include: {
          cities: {
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!country) throw new NotFoundException(`Country with ID ${id} not found`);
      return country;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Find Country failed for ID ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch country: ${error.message}`);
    }
  }

  async updateCountry(id: number, dto: UpdateCountryDto) {
    try {
      // Check existence
      await this.findOneCountry(id);

      return await this.prisma.country.update({
        where: { id },
        data: {
          name: dto.name,
          rank: dto.rank,
          isoCode: dto.isoCode?.toUpperCase(),
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Update Country failed for ID ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to update country: ${error.message}`);
    }
  }

  async removeCountry(id: number) {
    try {
      await this.findOneCountry(id);
      return await this.prisma.country.delete({ where: { id } });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Delete Country failed for ID ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete country: ${error.message}`);
    }
  }

  // ==================================================================
  // CITY OPERATIONS
  // ==================================================================

  async createCity(dto: CreateCityDto) {
    try {
      // Validate Country Exists
      const country = await this.prisma.country.findUnique({
        where: { id: dto.countryId },
      });
      if (!country) throw new NotFoundException(`Country ID ${dto.countryId} not found`);

      return await this.prisma.city.create({
        data: {
          name: dto.name,
          countryId: dto.countryId,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Create City failed: ${dto.name}`, error.stack);
      throw new InternalServerErrorException(`Failed to create city: ${error.message}`);
    }
  }

  async findAllCitiesByCountry(countryId: number) {
    try {
      return await this.prisma.city.findMany({
        where: { countryId },
        include: {
          country: { select: { name: true, isoCode: true } },
        },
      });
    } catch (error) {
      this.logger.error(`Find Cities failed for country ${countryId}`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch cities: ${error.message}`);
    }
  }

  async updateCity(id: number, dto: UpdateCityDto) {
    try {
      const city = await this.prisma.city.findUnique({ where: { id } });
      if (!city) throw new NotFoundException(`City with ID ${id} not found`);

      return await this.prisma.city.update({
        where: { id },
        data: { name: dto.name },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Update City failed for ID ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to update city: ${error.message}`);
    }
  }

  async removeCity(id: number) {
    try {
      const city = await this.prisma.city.findUnique({ where: { id } });
      if (!city) throw new NotFoundException(`City with ID ${id} not found`);

      return await this.prisma.city.delete({ where: { id } });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Delete City failed for ID ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete city: ${error.message}`);
    }
  }
}