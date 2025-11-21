import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { JobsModule } from "./common/utils/jobs/jobs.module";
import { RoomModule } from './modules/room/room.module';
import { ProposalModule } from './modules/proposal/proposal.module';
import { AuthModule } from "./modules/auth/auth.module";
import { CountryModule } from "./modules/country/country.module";
import { PlaceModule } from "./modules/place/place.module";
import { LocationModule } from "./modules/location/location.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { BotModule } from "./modules/bot/bot.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    CountryModule,
    PlaceModule,
    JobsModule,
    RoomModule,
    ProposalModule,
    LocationModule,
    NotificationModule,
    BotModule
 ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
