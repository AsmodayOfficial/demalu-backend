// src/notification/notification.module.ts
import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { OneSignalService } from "./notification.service";

@Module({
  imports: [HttpModule],
  providers: [OneSignalService],
  exports: [OneSignalService],
})
export class NotificationModule {}
