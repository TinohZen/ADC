import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.adc.presence',
  appName: 'ADC Présence',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#047857'
    }
  }
};

export default config;