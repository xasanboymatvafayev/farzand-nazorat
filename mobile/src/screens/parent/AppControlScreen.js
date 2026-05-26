import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Switch, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal, ActivityIndicator
} from 'react-native';
import { appsAPI } from '../../services/api';

const COLORS = { primary: '#2D6A4F', bg: '#F0FFF4', text: '#1B4332', danger: '#E74C3C' };

export default function AppControlScreen({ route }) {
  const { child } = route.params;
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [limitModal, setLimitModal] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [usage, setUsage] = useState([]);

  useEffect(() => {
    loadApps();
    loadUsage();
  }, []);

  const loadApps = async () => {
    try {
      const res = await appsAPI.getPermissions(child.id);
      setApps(res.data);
    } catch {}
    setLoading(false);
  };

  const loadUsage = async () => {
    try {
      const res = await appsAPI.getUsage(child.id);
      setUsage(res.data);
    } catch {}
  };

  const toggleApp = async (app) => {
    const updated = { is_allowed: !app.is_allowed };
    try {
      await appsAPI.updatePermission(child.id, app.id, updated);
      setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, ...updated } : a));
    } catch {
      Alert.alert('Xatolik', 'Yangilashda xatolik');
    }
  };

  const openLimitModal = (app) => {
    setSelected(app);
    setLimitInput(String(app.daily_limit_minutes || ''));
    setLimitModal(true);
  };

  const saveLimit = async () => {
    const minutes = parseInt(limitInput) || 0;
    try {
      await appsAPI.updatePermission(child.id, selected.id, { daily_limit_minutes: minutes });
      setApps((prev) => prev.map((a) => a.id === selected.id ? { ...a, daily_limit_minutes: minutes } : a));
      setLimitModal(false);
    } catch {
      Alert.alert('Xatolik');
    }
  };

  const getUsageForApp = (pkg) => {
    const log = usage.find((u) => u.package_name === pkg);
    return log ? log.usage_minutes : 0;
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 Ilovalar nazorati</Text>
        <Text style={styles.sub}>{child.full_name}</Text>
      </View>

      <FlatList
        data={apps}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Hali ilovalar sinxronlanmagan</Text>
            <Text style={styles.emptyHint}>Farzand telefoni ilovalar ro'yxatini yuborishi kerak</Text>
          </View>
        }
        renderItem={({ item }) => {
          const usedMin = getUsageForApp(item.package_name);
          const limitMin = item.daily_limit_minutes;
          const overLimit = limitMin > 0 && usedMin >= limitMin;

          return (
            <View style={[styles.appCard, !item.is_allowed && styles.appCardBlocked]}>
              <View style={styles.appLeft}>
                <View style={[styles.appIcon, !item.is_allowed && styles.appIconBlocked]}>
                  <Text style={styles.appIconText}>{item.app_name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.appName}>{item.app_name}</Text>
                  <Text style={styles.appPkg} numberOfLines={1}>{item.package_name}</Text>
                  {limitMin > 0 && (
                    <Text style={[styles.usageText, overLimit && styles.usageOver]}>
                      {usedMin}/{limitMin} daqiqa {overLimit ? '🚫' : ''}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.appRight}>
                <TouchableOpacity onPress={() => openLimitModal(item)} style={styles.limitBtn}>
                  <Text style={styles.limitBtnText}>
                    {limitMin > 0 ? `${limitMin}daq` : '⏱'}
                  </Text>
                </TouchableOpacity>
                <Switch
                  value={item.is_allowed}
                  onValueChange={() => toggleApp(item)}
                  trackColor={{ false: '#ccc', true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          );
        }}
      />

      {/* Limit Modal */}
      <Modal visible={limitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Kunlik vaqt chegarasi</Text>
            <Text style={styles.modalSub}>{selected?.app_name}</Text>
            <TextInput
              style={styles.limitInput}
              value={limitInput}
              onChangeText={setLimitInput}
              keyboardType="number-pad"
              placeholder="Daqiqalarda (0 = cheksiz)"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setLimitModal(false)}>
                <Text>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveLimit}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 56 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  sub: { fontSize: 13, color: '#74C69D', marginTop: 4 },
  list: { padding: 16 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#666' },
  emptyHint: { fontSize: 13, color: '#999', marginTop: 8, textAlign: 'center' },
  appCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, elevation: 2,
  },
  appCardBlocked: { opacity: 0.6 },
  appLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  appIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#74C69D', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  appIconBlocked: { backgroundColor: '#ccc' },
  appIconText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  appName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  appPkg: { fontSize: 11, color: '#999', maxWidth: 160 },
  usageText: { fontSize: 11, color: '#666', marginTop: 2 },
  usageOver: { color: COLORS.danger, fontWeight: '700' },
  appRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  limitBtn: { backgroundColor: '#EBF5FB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  limitBtnText: { fontSize: 12, color: '#1A5276', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalSub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 20 },
  limitInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    fontSize: 18, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  modalSave: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
});
