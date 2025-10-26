import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swasthyavaani.app',
  appName: 'Swasthya Vaani',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
