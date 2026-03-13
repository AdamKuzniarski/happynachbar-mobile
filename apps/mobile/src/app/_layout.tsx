import '../../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { getHealth } from '@/lib/health';

export default function RootLayout() {
  useEffect(() => {
    if (!__DEV__) return;

    void getHealth().catch(() => {
      // Keep this silent in UI; this is only a dev smoke-check for API connectivity.
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
