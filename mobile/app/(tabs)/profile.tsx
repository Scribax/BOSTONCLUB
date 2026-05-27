import React, { useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../contexts/ThemeContext';
import ProfileDefault from '../../components/profile/ProfileDefault';
import ProfileHalloween from '../../components/profile/ProfileHalloween';
import ProfileArgentina from '../../components/profile/ProfileArgentina';

export default function ProfileScreen() {
  const { isEnabled, theme } = useTheme();
  
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [customAvatars, setCustomAvatars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const lastFetchRef = useRef(0);
  const REFETCH_COOLDOWN = 60_000;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const checkBiometrics = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (isMounted) setIsBiometricSupported(compatible && isEnrolled);

        const storedPref = await SecureStore.getItemAsync('biometrics_enabled');
        if (isMounted) setBiometricsEnabled(storedPref === 'true');
      };

      const fetchUser = async () => {
        const now = Date.now();
        if (user && now - lastFetchRef.current < REFETCH_COOLDOWN) {
          setLoading(false);
          return;
        }

        if (!user) setLoading(true);
        try {
          const [userRes, settingsRes, avatarsRes] = await Promise.all([
            api.get('/auth/me'),
            api.get('/settings').catch(() => ({ data: null })),
            api.get('/avatars').catch(() => ({ data: [] }))
          ]);
          if (isMounted) {
            setUser(userRes.data);
            setSettings(settingsRes.data);
            setCustomAvatars(avatarsRes.data || []);
            lastFetchRef.current = Date.now();
          }
        } catch (err) {
          // Session error handled by interceptor
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchUser();
      checkBiometrics();

      return () => {
        isMounted = false;
      };
    }, [user])
  );

  if (loading && !user) {
    return (
      <View className={`flex-1 bg-[${theme.name === 'halloween' ? '#0a050f' : '#050505'}] items-center justify-center`}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  // Guard de seguridad
  if (!user) {
    return (
      <View className={`flex-1 bg-[${theme.name === 'halloween' ? '#0a050f' : '#050505'}] items-center justify-center`}>
        <Text className="text-white/20 uppercase font-black tracking-widest text-[10px]">Sin datos de perfil</Text>
      </View>
    );
  }

  const props = {
    user,
    setUser,
    settings,
    customAvatars,
    isBiometricSupported,
    biometricsEnabled,
    setBiometricsEnabled,
    theme,
    isEnabled
  };

  if (theme.name === 'halloween') return <ProfileHalloween {...props} />;
  if (theme.name === 'argentina') return <ProfileArgentina {...props} />;

  return <ProfileDefault {...props} />;
}
