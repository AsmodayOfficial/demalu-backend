import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
  private readonly baseUrl = 'https://api.onesignal.com/notifications';
  
  // Replace with your actual keys or use Env variables
  private readonly appId = '8ca6cc83-51f1-4660-9c38-8083061dc06e';
  private readonly authKey = 'os_v2_app_rstmza2r6fdgbhbyqcbqmhoan33qknmxkj7ew5uy25iwfrb64n4tfgxvmo2hzb6f7f5j5ddjmcudyivg2jyf6vxkp35jhuqvbqic3uq';

  constructor(private readonly http: HttpService) {}

  /**
   * Sends an SOS notification to a list of user IDs.
   */
  async sendSos(targetUserIds: number[], data: SosNotificationData) {
    if (!targetUserIds.length) return;

    // Construct filters for multiple users: "user_id = 1 OR user_id = 2 ..."
    // Note: OneSignal limits complex filters. For simple lists of UserIDs, 
    // 'include_external_user_ids' is often easier, but we stick to tags if you use tags.
    // This example assumes you map your DB ID to OneSignal 'external_user_id'.
    
    const body = {
      app_id: this.appId,
      include_external_user_ids: targetUserIds.map(id => id.toString()), 
      // If you strictly use TAGS, uncomment below and comment line above:
      // filters: targetUserIds.map((id, index) => {
      //   const filter = { field: "tag", key: "user_id", relation: "=", value: id.toString() };
      //   return index < targetUserIds.length - 1 ? [filter, { operator: "OR" }] : filter;
      // }).flat(),
      
      target_channel: 'push',
      headings: {
        en: 'SOS ALERT!',
        ru: 'СИГНАЛ SOS!',
      },
      contents: {
        en: `${data.senderName} needs help!`,
        ru: `${data.senderName} просит помощи!`,
      },
      data: data, // Payload for deep linking/map opening
      priority: 10, // High priority
      android_channel_id: 'sos_channel', // Ensure you create this channel on Android with high importance/sound
      ios_sound: 'sos_alarm.wav',
    };

    try {
      this.logger.log(`Sending SOS to ${targetUserIds.length} users...`);
      const res = await firstValueFrom(
        this.http.post(this.baseUrl, body, {
          headers: {
            Authorization: `Basic ${this.authKey}`, // Usually requires 'Basic ' prefix
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(`OneSignal Response: ${JSON.stringify(res.data)}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`OneSignal Error: ${error.response?.data || error.message}`);
      // We don't throw here to prevent crashing the whole request flow if push fails
    }
  }
}