import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { CronJobService } from "./cron.service";
import { MssqlService } from "./mssql.service";
import { MinioModule } from "../minio/minio.module";

@Module({
  imports: [ScheduleModule.forRoot(), MinioModule],
  providers: [CronJobService, MssqlService],
  exports: [CronJobService, MssqlService],
})
export class JobsModule {}
