import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import ChildLoginScreen from './screens/auth/ChildLoginScreen';
import SetPINScreen from './screens/auth/SetPINScreen';
import ParentHomeScreen from './screens/parent/ParentHomeScreen';
import AppControlScreen from './screens/parent/AppControlScreen';
import LocationMapScreen from './screens/parent/LocationMapScreen';
import EducationScreen from './screens/parent/EducationScreen';
import ChildHomeScreen from './screens/child/ChildHomeScreen';

import { useAuthStore } from './store';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, isLoading, isParent, init } = useAuthStore();

  useEffect(() => { init(); }, []);

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#2D6A4F" />
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ChildLogin" component={ChildLoginScreen} />
          </>
        ) : !isParent ? (
          // Child mode
          <Stack.Screen name="ChildHome" component={ChildHomeScreen} />
        ) : (
          // Parent mode
          <>
            <Stack.Screen name="SetPIN" component={SetPINScreen} />
            <Stack.Screen name="ParentHome" component={ParentHomeScreen} />
            <Stack.Screen name="AppControl" component={AppControlScreen} />
            <Stack.Screen name="LocationMap" component={LocationMapScreen} />
            <Stack.Screen name="Education" component={EducationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
