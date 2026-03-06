import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chasma.novo',
  appName: 'ChasmaNOVO',
  webDir: 'dist/web-spa/browser',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
