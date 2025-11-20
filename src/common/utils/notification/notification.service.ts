// src/notification/onesignal.service.ts
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

type Localized = { en: string; ru: string };

export interface OneSignalData {
  uuid: string;
  companyId: number;
  objectId: number | null;
  projectId: number | null;
  ownerId: number;
  comment: string;
}

@Injectable()
export class OneSignalService {
  private readonly baseUrl = "https://api.onesignal.com/notifications?c=push";
  private readonly appId = "8ca6cc83-51f1-4660-9c38-8083061dc06e";
  private readonly authKey = "os_v2_app_rstmza2r6fdgbhbyqcbqmhoan33qknmxkj7ew5uy25iwfrb64n4tfgxvmo2hzb6f7f5j5ddjmcudyivg2jyf6vxkp35jhuqvbqic3uq";

  constructor(private readonly http: HttpService) {}

  async sendPush(headings: Localized, contents: Localized, data: OneSignalData) {
    const body = {
      app_id: this.appId,
      // include_external_user_ids: [data.ownerId.toString()],
      filters: [{ field: "tag", key: "user_id", relation: "=", value: data.ownerId.toString() }],
      target_channel: "push",
      headings: {
        en: headings.en,
        ru: headings.ru,
      },
      contents: {
        en: contents.en,
        ru: contents.ru,
      },
      data,
    };

    try {
      const res = await firstValueFrom(
        this.http.post(this.baseUrl, body, {
          headers: {
            Authorization: this.authKey,
            "Content-Type": "application/json",
          },
        }),
      );
      return res.data;
    } catch (error: any) {
      throw new HttpException(
        {
          message: "Failed to send OneSignal notification",
          error: error?.response?.data || error?.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
