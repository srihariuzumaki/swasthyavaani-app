import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swasthyavaani.app',
  appName: 'Swasthya Vaani',
  webDir: 'dist',
  // Cleartext is disabled for production HTTPS
  // Only enable for local development if needed
  server: {
    cleartext: false,
    // hostname: '192.168.x.x', // Uncomment and set your local IP for local dev
    // url: 'http://192.168.x.x:5173', // Uncomment for local dev server
  }
};

export default config;
