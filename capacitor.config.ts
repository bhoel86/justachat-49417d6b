import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.justachat.app',
  appName: 'Justachat',
  webDir: 'dist',
  server: {
    url: 'https://justachat.net',
    cleartext: true
  }
};

export default config;
