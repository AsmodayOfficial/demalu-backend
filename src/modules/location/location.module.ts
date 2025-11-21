import { Module } from '@nestjs/common';
import { UserLocationController } from './location.controller';
import { UserLocationService } from './location.service';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserLocationGateway } from './location.gateway';
import { RoomModule } from '../room/room.module';


@Module({
  imports: [RoomModule],
  controllers: [UserLocationController],
  providers: [UserLocationService,UserLocationGateway, PrismaService, JwtService],
  exports: [UserLocationService,UserLocationGateway]
})
export class LocationModule {}
