import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { authAPI } from '../../services/api';

const COLORS = { primary: '#2D6A4F', accent: '#74C69D', bg: '#F0FFF4', text: '#1B4332' };

export default function SetPINScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('set'); // 'set' | 'confirm'
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit) => {
    if (step === 'set') {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => setStep('confirm'), 300);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const newConfirm = confirmPin + digit;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 4) {
          setTimeout(() => savePin(newConfirm), 300);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'set') setPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  const savePin = async (confirmedPin) => {
    if (pin !== confirmedPin) {
      Alert.alert('Xatolik', 'PIN kodlar mos kelmadi');
      setConfirmPin('');
      setStep('set');
      setPin('');
      return;
    }
    setLoading(true);
    try {
      await authAPI.setPin(pin);
      navigation.replace('ParentHome');
    } catch (e) {
      Alert.alert('Xatolik', 'PIN saqlashda xatolik');
      setConfirmPin('');
      setStep('set');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const current = step === 'set' ? pin : confirmPin;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>{step === 'set' ? 'PIN kod o\'rnatish' : 'PIN kodni tasdiqlang'}</Text>
        <Text style={styles.sub}>
          {step === 'set'
            ? '4 raqamli PIN kod kiriting\n(Ilovani o\'chirishdan himoya qiladi)'
            : 'PIN kodni qayta kiriting'}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.dot, current.length > i && styles.dotFilled]} />
        ))}
      </View>

      {loading && <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 20 }} />}

      {/* Keypad */}
      <View style={styles.keypad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.key, !k && styles.keyEmpty]}
            onPress={() => k === '⌫' ? handleDelete() : k && handleDigit(k)}
            disabled={!k || loading}
          >
            <Text style={k === '⌫' ? styles.keyDelete : styles.keyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', paddingTop: 80 },
  header: { alignItems: 'center', marginBottom: 48 },
  icon: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  sub: { fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 48 },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.primary, backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: COLORS.primary },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 16, justifyContent: 'center' },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  keyEmpty: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  keyText: { fontSize: 24, fontWeight: '600', color: COLORS.text },
  keyDelete: { fontSize: 22 },
});
