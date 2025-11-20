import { Module } from '@nestjs/common';
import { PlaceService } from './place.service';
import { PlaceController } from './place.controller';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [PlaceController],
  providers: [PlaceService, PrismaService, JwtService],
  exports: [PlaceService]
})
export class PlaceModule {}
