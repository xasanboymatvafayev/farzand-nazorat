import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { childrenAPI } from '../../services/api';
import { useChildStore, useAuthStore } from '../../store';

const COLORS = {
  primary: '#2D6A4F', secondary: '#40916C', accent: '#74C69D',
  bg: '#F0FFF4', text: '#1B4332', card: '#fff',
};

export default function ParentHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { children, setChildren } = useChildStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const loadChildren = async () => {
    try {
      const res = await childrenAPI.list();
      setChildren(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadChildren(); }, []);

  const addChild = () => navigation.navigate('AddChild');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Assalomu alaykum 👋</Text>
          <Text style={styles.name}>{user?.full_name || user?.phone}</Text>
        </View>
        <View style={styles.headerActions}>
          <Text style={styles.barcode}>📋 {user?.barcode}</Text>
          <TouchableOpacity onPress={() => Alert.alert('Chiqish', 'Rostdan ham chiqmoqchimisiz?', [
            { text: 'Yo\'q' },
            { text: 'Ha', onPress: logout, style: 'destructive' },
          ])}>
            <Text style={styles.logoutBtn}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadChildren(); }} />}
      >
        {/* Barcode info */}
        <View style={styles.barcodeCard}>
          <Text style={styles.barcodeTitle}>🔖 Sizning shtrix kodingiz</Text>
          <Text style={styles.barcodeValue}>{user?.barcode}</Text>
          <Text style={styles.barcodeHint}>Farzandingizning telefonida bu kodni kiriting</Text>
        </View>

        {/* Children list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Farzandlar</Text>
            <TouchableOpacity style={styles.addBtn} onPress={addChild}>
              <Text style={styles.addBtnText}>+ Qo'shish</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : children.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>👨‍👧</Text>
              <Text style={styles.emptyText}>Hali farzand qo'shilmagan</Text>
              <Text style={styles.emptyHint}>
                Yuqoridagi shtrix kodni farzandingiz telefoniga kiriting
              </Text>
            </View>
          ) : (
            children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={styles.childCard}
                onPress={() => navigation.navigate('ChildDetail', { child })}
              >
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>{child.full_name[0]}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.full_name}</Text>
                  <Text style={styles.childGrade}>{child.grade}-sinf</Text>
                </View>
                <Text style={styles.childArrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tezkor amallar</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: '📍', label: 'Joylashuv', screen: 'LocationMap' },
              { icon: '📱', label: 'Ilovalar', screen: 'AppControl' },
              { icon: '📚', label: 'Testlar', screen: 'Education' },
              { icon: '⏰', label: 'Vaqt', screen: 'ScreenTime' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickCard}
                onPress={() => children[0] && navigation.navigate(item.screen, { child: children[0] })}
              >
                <Text style={styles.quickIcon}>{item.icon}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 24,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  greeting: { fontSize: 13, color: COLORS.accent },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerActions: { alignItems: 'flex-end', gap: 4 },
  barcode: { fontSize: 11, color: COLORS.accent },
  logoutBtn: { fontSize: 22 },
  content: { padding: 20, paddingBottom: 40 },
  barcodeCard: {
    backgroundColor: COLORS.secondary, borderRadius: 16, padding: 20, marginBottom: 24,
  },
  barcodeTitle: { color: '#fff', fontSize: 13, marginBottom: 8 },
  barcodeValue: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 3 },
  barcodeHint: { color: COLORS.accent, fontSize: 12, marginTop: 6 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6, maxWidth: 260 },
  childCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    elevation: 2,
  },
  childAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  childAvatarText: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  childInfo: { flex: 1, marginLeft: 14 },
  childName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  childGrade: { fontSize: 13, color: '#666', marginTop: 2 },
  childArrow: { fontSize: 24, color: '#ccc' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '47%', backgroundColor: COLORS.card, borderRadius: 16,
    padding: 20, alignItems: 'center', elevation: 2,
  },
  quickIcon: { fontSize: 32 },
  quickLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 8 },
});
