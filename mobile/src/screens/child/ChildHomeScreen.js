import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, AppState, Alert, BackHandler
} from 'react-native';
import { useAuthStore } from '../../store';
import { appsAPI, locationAPI } from '../../services/api';
import Geolocation from '@react-native-community/geolocation';

/**
 * ChildHomeScreen - runs invisibly as a background service on child's phone.
 * Monitors: app usage, location, enforces restrictions.
 * The child sees a simple "protected" screen.
 */
export default function ChildHomeScreen() {
  const childId = useAuthStore((s) => s.childId);
  const appState = useRef(AppState.currentState);
  const locationInterval = useRef(null);
  const usageInterval = useRef(null);
  const currentApp = useRef(null);
  const appStartTime = useRef(null);

  useEffect(() => {
    startLocationTracking();
    startUsageTracking();

    const sub = AppState.addEventListener('change', handleAppStateChange);

    // Prevent back button (Android)
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      sub.remove();
      backSub.remove();
      clearInterval(locationInterval.current);
      clearInterval(usageInterval.current);
    };
  }, []);

  const startLocationTracking = () => {
    locationInterval.current = setInterval(() => {
      Geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await locationAPI.update(childId, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          } catch {}
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }, 30000); // Every 30 seconds
  };

  const startUsageTracking = () => {
    usageInterval.current = setInterval(async () => {
      // In a real device, use NativeModules to get foreground app
      // This is a placeholder - actual implementation uses Android UsageStatsManager
      // via a native module
      try {
        await appsAPI.reportUsage(childId, []);
      } catch {}
    }, 60000); // Every minute
  };

  const handleAppStateChange = async (nextState) => {
    if (nextState === 'background' || nextState === 'active') {
      // Check if current foreground app is allowed
      // Actual foreground app detection requires native module
    }
    appState.current = nextState;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.shield}>🛡️</Text>
      <Text style={styles.title}>Farzad Nazorat</Text>
      <Text style={styles.sub}>Bu telefon ota-ona nazorati ostida</Text>
      <View style={styles.statusCard}>
        <Text style={styles.statusText}>✅ Himoya faol</Text>
        <Text style={styles.statusSub}>Barcha faoliyat kuzatilmoqda</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#1B4332',
    alignItems: 'center', justifyContent: 'center',
  },
  shield: { fontSize: 80 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 16 },
  sub: { fontSize: 14, color: '#74C69D', marginTop: 8, textAlign: 'center' },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    padding: 20, marginTop: 32, alignItems: 'center', minWidth: 220,
  },
  statusText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusSub: { color: '#74C69D', fontSize: 12, marginTop: 4 },
});
