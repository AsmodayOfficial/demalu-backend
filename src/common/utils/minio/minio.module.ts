import { Module } from "@nestjs/common";
import { MinioService } from "./minio.service";
import { UploadService } from "./upload.service";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [MinioService, UploadService],
  exports: [MinioService, UploadService],
})
export class MinioModule {}
