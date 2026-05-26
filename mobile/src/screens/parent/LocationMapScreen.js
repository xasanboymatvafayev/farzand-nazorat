import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { locationAPI } from '../../services/api';
import { BASE_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LocationMapScreen({ route }) {
  const { child } = route.params;
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    loadLocation();
    connectWS();
    const interval = setInterval(loadLocation, 30000);
    return () => {
      clearInterval(interval);
      ws?.close();
    };
  }, []);

  const loadLocation = async () => {
    try {
      const res = await locationAPI.current(child.id);
      setLocation(res.data);
    } catch {}
    setLoading(false);
  };

  const connectWS = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const wsUrl = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '');
      // In real app, parse user ID from JWT
      const socket = new WebSocket(`${wsUrl}/ws/parent/1/`);
      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'location' && data.child_id === child.id) {
          setLocation({ latitude: data.latitude, longitude: data.longitude });
        }
      };
      setWs(socket);
    } catch {}
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#2D6A4F" size="large" />
      <Text style={styles.loadingText}>Joylashuv aniqlanmoqda...</Text>
    </View>
  );

  if (!location) return (
    <View style={styles.center}>
      <Text style={styles.noLocIcon}>📍</Text>
      <Text style={styles.noLocText}>Joylashuv topilmadi</Text>
      <Text style={styles.noLocHint}>Farzandning telefoni internetga ulanganligini tekshiring</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={loadLocation}>
        <Text style={styles.retryText}>Qayta urinish</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 {child.full_name}ning joylashuvi</Text>
      </View>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
          }}
          title={child.full_name}
          description="Oxirgi ko'rilgan joylashuv"
        >
          <View style={styles.marker}>
            <Text style={styles.markerText}>{child.full_name[0]}</Text>
          </View>
        </Marker>
      </MapView>
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          📡 Jonli kuzatuv • Har 30 soniyada yangilanadi
        </Text>
        {location.recorded_at && (
          <Text style={styles.infoTime}>
            Oxirgi yangilanish: {new Date(location.recorded_at).toLocaleTimeString('uz-UZ')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FFF4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  noLocIcon: { fontSize: 56 },
  noLocText: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 12 },
  noLocHint: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8, maxWidth: 260 },
  retryBtn: { backgroundColor: '#2D6A4F', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, marginTop: 20 },
  retryText: { color: '#fff', fontWeight: '700' },
  header: { backgroundColor: '#2D6A4F', padding: 16, paddingTop: 48 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  map: { flex: 1 },
  marker: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2D6A4F', borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  markerText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  infoBar: { backgroundColor: '#fff', padding: 14, borderTopWidth: 1, borderColor: '#eee' },
  infoText: { fontSize: 13, color: '#2D6A4F', fontWeight: '600' },
  infoTime: { fontSize: 11, color: '#999', marginTop: 4 },
});
