import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store';

const COLORS = {
  primary: '#2D6A4F',
  secondary: '#40916C',
  accent: '#74C69D',
  bg: '#F0FFF4',
  text: '#1B4332',
  gray: '#95A5A6',
};

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const login = useAuthStore((s) => s.login);

  const formatPhone = (text) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned.startsWith('998')) cleaned = '998' + cleaned;
    return '+' + cleaned;
  };

  const sendOTP = async () => {
    if (phone.length < 9) {
      Alert.alert('Xatolik', 'Telefon raqamni to\'liq kiriting');
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      const res = await authAPI.sendOTP(formattedPhone);
      setStep('otp');
      if (res.data.demo) {
        setDemoCode(res.data.demo_code);
        Alert.alert('Demo Rejim', `SMS yuborildi!\nDemo kod: ${res.data.demo_code}`);
      } else {
        Alert.alert('Muvaffaqiyat', 'SMS yuborildi');
      }
    } catch (e) {
      Alert.alert('Xatolik', e.response?.data?.error || 'SMS yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length < 6) {
      Alert.alert('Xatolik', '6 raqamli kodni kiriting');
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      const res = await authAPI.verifyOTP(formattedPhone, otp);
      await login(res.data, res.data.user);
      if (!res.data.user.app_pin) {
        navigation.replace('SetPIN');
      } else {
        navigation.replace('ParentHome');
      }
    } catch (e) {
      Alert.alert('Xatolik', e.response?.data?.error || 'Noto\'g\'ri kod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🛡️</Text>
          <Text style={styles.logoTitle}>Farzad Nazorat</Text>
          <Text style={styles.logoSub}>Farzandingiz xavfsizligi</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {step === 'phone' ? (
            <>
              <Text style={styles.label}>Telefon raqam</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.prefix}>+998</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="90 123 45 67"
                  keyboardType="phone-pad"
                  maxLength={12}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <TouchableOpacity style={styles.btn} onPress={sendOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SMS Yuborish</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Tasdiqlash kodi</Text>
              <Text style={styles.hint}>+998{phone} raqamiga yuborildi</Text>
              {demoCode ? (
                <Text style={styles.demoHint}>Demo kod: {demoCode}</Text>
              ) : null}
              <TextInput
                style={styles.otpInput}
                placeholder="______"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                textAlign="center"
              />
              <TouchableOpacity style={styles.btn} onPress={verifyOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Tasdiqlash</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('phone')}>
                <Text style={styles.back}>← Orqaga</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Switch to Child mode */}
        <TouchableOpacity
          style={styles.childBtn}
          onPress={() => navigation.navigate('ChildLogin')}
        >
          <Text style={styles.childBtnText}>👧 Farzand sifatida kirish</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoBox: { alignItems: 'center', marginBottom: 36 },
  logoIcon: { fontSize: 64 },
  logoTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  logoSub: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  hint: { fontSize: 13, color: COLORS.gray, marginBottom: 8 },
  demoHint: { fontSize: 13, color: '#E74C3C', fontWeight: '600', marginBottom: 8 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  prefix: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  phoneInput: { flex: 1, fontSize: 18, paddingHorizontal: 14, color: COLORS.text },
  otpInput: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
    paddingVertical: 12,
    marginBottom: 20,
    color: COLORS.text,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { color: COLORS.secondary, textAlign: 'center', marginTop: 16, fontSize: 14 },
  childBtn: {
    marginTop: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  childBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
