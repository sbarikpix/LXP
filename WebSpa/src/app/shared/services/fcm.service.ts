import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { NotificationCommandModel } from '@app/shared/models/commonmodel';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FcmService {
  baseUrl = environment.issuer + '/api/FirebaseMessaging';

  constructor(private apiService: ApiService) {}

  token: string | null = null;

  async initPush() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Permission not granted');
      return;
    }

    await PushNotifications.register();

    this.addListeners();
  }

  addListeners() {
    PushNotifications.addListener('registration', (token) => {
      console.log('Token:', token.value);
      this.token = token.value;
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (n) => {
      console.log('Notification received', n);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (n) => {
      console.log('Notification action performed', n);
    });
  }

  sendNotification(command: NotificationCommandModel) {
    const deviceToken =
      this.token ||
      'cRuu4R8FSLek3scxm5cUGk:APA91bFZjoZtxahMI1P9yjXZxKuNT0AGcyytSk1mwmwvzOZSZHV7rxJWUy-3wXSI3mNT43YdBG25DgapcTHS6oRSEOE0eHNcAgVHdlGzMOWCe5VrT94hmdw';

    command.imageUrl =
      'https://chasmadevstore.blob.core.windows.net/public/novo_logo.png';
    const payload = { ...command, deviceToken };

    return this.apiService.post<any>(
      `${this.baseUrl}/sendNotification`,
      payload
    );
  }
}
