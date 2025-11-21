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
  private readonly appId = '7e5cf75a-8343-4df7-81b0-d14d1f15ec9d';
  private readonly authKey = 'os_v2_app_rstmza2r6fdgbhbyqcbqmhoan33qknmxkj7ew5uy25iwfrb64n4tfgxvmo2hzb6f7f5j5ddjmcudyivg2jyf6vxkp35jhuqvbqic3uq';

  constructor(private readonly http: HttpService) {}

  async sendSos(targetUserIds: number[], data: SosNotificationData) {
    if (!targetUserIds.length) return;

    const body = {
      app_id: this.appId,
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