import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [RoomController],
  providers: [RoomService, PrismaService, JwtService],
  exports: [RoomService]
})
export class RoomModule {}
