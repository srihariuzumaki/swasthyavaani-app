import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swasthyavaani.app',
  appName: 'Swasthya Vaani',
  webDir: 'dist',
  server: {
    // Use HTTP scheme so WebView doesn't block HTTP API calls
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
