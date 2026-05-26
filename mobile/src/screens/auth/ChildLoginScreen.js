import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { childrenAPI } from '../../services/api';
import { useAuthStore } from '../../store';
import DeviceInfo from 'react-native-device-info';

const COLORS = { primary: '#1A5276', accent: '#3498DB', bg: '#EBF5FB', text: '#1A2535' };

export default function ChildLoginScreen({ navigation }) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const switchToChild = useAuthStore((s) => s.switchToChild);

  const link = async () => {
    if (!barcode || !name || !grade) {
      Alert.alert('Xatolik', 'Barcha maydonlarni to\'ldiring');
      return;
    }
    setLoading(true);
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const res = await childrenAPI.linkDevice({
        parent_barcode: barcode.toUpperCase(),
        full_name: name,
        grade: parseInt(grade),
        device_id: deviceId,
      });
      await switchToChild(res.data.child.id);
      navigation.replace('ChildHome');
    } catch (e) {
      Alert.alert('Xatolik', e.response?.data?.error || 'Ulanishda xatolik. Shtrix kodni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Orqaga</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.icon}>👧</Text>
        <Text style={styles.title}>Farzand sifatida kirish</Text>
        <Text style={styles.sub}>Ota-ona bergan 14 belgili shtrix kodni kiriting</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Shtrix Kod (14 belgi)</Text>
        <TextInput
          style={styles.barcodeInput}
          placeholder="A1B2C3D4E5F6G7"
          value={barcode}
          onChangeText={(t) => setBarcode(t.toUpperCase())}
          maxLength={14}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Farzand ismi</Text>
        <TextInput
          style={styles.input}
          placeholder="Ismi Familiyasi"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Sinfi (1-11)</Text>
        <TextInput
          style={styles.input}
          placeholder="Masalan: 5"
          value={grade}
          onChangeText={setGrade}
          keyboardType="number-pad"
          maxLength={2}
        />

        <TouchableOpacity style={styles.btn} onPress={link} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Ulash</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { padding: 24 },
  back: { marginBottom: 20 },
  backText: { color: COLORS.accent, fontSize: 16 },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  sub: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 4 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  barcodeInput: {
    borderWidth: 2, borderColor: COLORS.accent, borderRadius: 10,
    fontSize: 18, letterSpacing: 3, fontWeight: '700',
    paddingHorizontal: 16, paddingVertical: 14, textAlign: 'center',
  },
  input: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    fontSize: 16, paddingHorizontal: 16, paddingVertical: 12,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
