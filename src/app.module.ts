import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { JobsModule } from "./common/utils/jobs/jobs.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    JobsModule,
 ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
