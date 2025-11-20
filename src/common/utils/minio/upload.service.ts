import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { MinioService } from "./minio.service";
import messages from "src/configs/messages";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly minioService: MinioService) {}

  async uploadFile(directory: string, file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException(messages.NO_FILE);
    }

    if (file.size === 0) {
      throw new BadRequestException(messages.FILE_EMPTY);
    }
    const recoveredName = Buffer.from(file.originalname, "latin1").toString("utf-8");

    const fileName = `${Date.now()}-${recoveredName}`;
    const fileUrl = await this.minioService.uploadFile(directory, file.buffer, fileName, file.mimetype);

    return fileUrl;
  }
  async cleanUnusedImages(prefix: string, imageUrls: string | string[]): Promise<void> {
    try {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      const bucketName = this.minioService.getBucketName();
      const usedKeys = new Set(
        urls
          .filter(url => !!url)
          .map(url => {
            try {
              return decodeURIComponent(url.split(`${bucketName}/`)[1]);
            } catch {
              return null;
            }
          })
          .filter(key => key && key.startsWith(prefix)) as string[],
      );

      await this.minioService.deleteUnusedObjectsFromMinio(prefix, usedKeys);
    } catch (error) {
      this.logger.error(`❌ Error during cleanup of '${prefix}': ${error.message}`, error.stack);
    }
  }
}
