import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { LocationModule } from '../location/location.module';
import { PrismaService } from 'src/database/prisma.service';
import { OneSignalService } from './one-signal.service';
import { HttpModule } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';


@Module({
  imports: [
    LocationModule,
    HttpModule
  ],
  controllers: [NotificationController],
  providers: [NotificationService, OneSignalService, PrismaService, JwtService],
  exports: [NotificationService, OneSignalService,]
})
export class NotificationModule {}