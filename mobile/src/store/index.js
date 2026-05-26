import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  isParent: true,
  childId: null,

  init: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userStr = await AsyncStorage.getItem('user');
      const childIdStr = await AsyncStorage.getItem('child_id');
      const mode = await AsyncStorage.getItem('mode'); // 'parent' | 'child'
      if (token && userStr) {
        set({
          user: JSON.parse(userStr),
          isParent: mode !== 'child',
          childId: childIdStr ? parseInt(childIdStr) : null,
        });
      }
    } catch {}
    set({ isLoading: false });
  },

  login: async (tokens, user) => {
    await AsyncStorage.multiSet([
      ['access_token', tokens.access],
      ['refresh_token', tokens.refresh],
      ['user', JSON.stringify(user)],
      ['mode', 'parent'],
    ]);
    set({ user, isParent: true });
  },

  switchToChild: async (childId) => {
    await AsyncStorage.multiSet([
      ['mode', 'child'],
      ['child_id', String(childId)],
    ]);
    set({ isParent: false, childId });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user', 'mode', 'child_id']);
    set({ user: null, isParent: true, childId: null });
  },
}));

export const useChildStore = create((set) => ({
  children: [],
  selectedChild: null,

  setChildren: (children) => set({ children }),
  setSelected: (child) => set({ selectedChild: child }),
}));
