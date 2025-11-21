// src/notification/onesignal.service.ts (Revised)

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// Define the structure for the data payload (can be extended if needed)
export interface SosNotificationData {
  type: 'SOS';
  senderId: number;
  senderName: string;
  roomId: number;
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  // Using the base URL format from your working example
  private readonly baseUrl = 'https://api.onesignal.com/notifications?c=push'; 
  
  // Use your actual keys
  private readonly appId = '7e5cf75a-8343-4df7-81b0-d14d1f15ec9d';
  private readonly authKey = 'os_v2_app_pzopowuding7panq2fgr6fpmtwngwpthrfyez75o57ao6uv5hgsl32g4dg5ffrgjcge3mgdjuww2r4jumsabsazjiktpusqkmn5tdly';

  constructor(private readonly http: HttpService) {}

  /**
   * Sends an SOS notification to a list of users, targeting them by External User IDs.
   * @param targetUserIds A list of user IDs to receive the notification.
   * @param data The custom data payload including sender and location info.
   */
  async sendSos(targetUserIds: number[], data: SosNotificationData) {
    if (!targetUserIds.length) {
      this.logger.warn('Attempted to send SOS with empty targetUserIds list.');
      return;
    }

    const body = {
      app_id: this.appId,
      // Target users by their external IDs (telegramId in this context)
      include_external_user_ids: targetUserIds.map(id => id.toString()), 
      
      target_channel: 'push',
      headings: {
        en: 'SOS ALERT!',
        ru: 'СИГНАЛ SOS!',
      },
      contents: {
        en: `${data.senderName} needs help!`,
        ru: `${data.senderName} просит помощи!`,
      },
      data: data, // Custom payload
      priority: 10,
      ios_sound: 'sos_alarm.wav',
    };

    try {
      this.logger.log(`Sending SOS to ${targetUserIds.length} users...`);
      const res = await firstValueFrom(
        this.http.post(this.baseUrl, body, {
          headers: {
            Authorization: this.authKey, 
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(`OneSignal Response: ${JSON.stringify(res.data)}`);
      return res.data;
      
    // ... inside OneSignalService.ts

    } catch (error: any) {
      // 1. Determine the detailed error data
      let errorData = error?.response?.data;
      
      // 2. Check if the data is an object and stringify it
      const errorDetail = 
          (typeof errorData === 'object' && errorData !== null) 
          ? JSON.stringify(errorData) 
          : error?.message || 'Unknown Error';
      
      this.logger.error(`OneSignal Error Details: ${errorDetail}`); // This will now log the detailed JSON

      throw new HttpException(
        {
          message: "Failed to send OneSignal SOS notification",
          error: errorDetail, // Use the stringified error detail here too
        },
        HttpStatus.BAD_REQUEST, 
      );
    }
  }
}