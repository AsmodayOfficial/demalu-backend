import { Module } from '@nestjs/common';
import { UserLocationController } from './location.controller';
import { UserLocationService } from './location.service';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';


@Module({
  controllers: [UserLocationController],
  providers: [UserLocationService, PrismaService, JwtService],
})
export class LocationModule {}
