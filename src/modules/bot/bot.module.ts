import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { RoomModule } from '../room/room.module';
import { LocationModule } from '../location/location.module';
import { BotUpdate } from './update.service';
import { PrismaService } from 'src/database/prisma.service';
import { BotService } from './bot.service';

@Module({
  imports: [
  AuthModule,
    NotificationModule,
    LocationModule,
    RoomModule,
  ],
  providers: [BotUpdate, BotService, PrismaService],
})
export class BotModule {}