import { Module } from '@nestjs/common';
import { RegionController } from './country.controller';
import { RegionService } from './country.service';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [RegionController],
  providers: [RegionService, PrismaService, JwtService],
  exports: [RegionService]
})
export class CountryModule {}
