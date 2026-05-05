import React, { useEffect, useState } from 'react';
import { Animated, BackHandler, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import RewardQRDefault from '../components/redemptions/RewardQRDefault';
import RewardQRHalloween from '../components/redemptions/RewardQRHalloween';
import RewardQRArgentina from '../components/redemptions/RewardQRArgentina';

export default function RewardQRScreen() {
  const { token, reward } = useLocalSearchParams<{ token: string; reward: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [cancelling, setCancelling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totpTimestamp, setTotpTimestamp] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(30);

  const handleCancel = async () => {
    Alert.alert(
      'Cancelar Canje',
      '¿Estás seguro de que deseas cancelar este código QR?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.post('/redemptions/cancel', { qrToken: token });
              Alert.alert('Cancelado', 'Tu código QR ha sido cancelado exitosamente.');
              router.replace('/(tabs)');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Hubo un error al cancelar.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (!isCompleted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTotpTimestamp(Date.now());
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isCompleted]);

  useEffect(() => {
    const backAction = () => {
      if (!isCompleted && !cancelling) {
        Alert.alert("Canje Pendiente", "Tu código QR sigue activo. Puedes encontrarlo en la sección de 'Mis Canjes' si sales de esta pantalla.", [
          { text: "Entendido", onPress: () => router.back(), style: "cancel" },
          { text: "Seguir Aquí", onPress: () => null }
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();

    if (token && !isCompleted) {
      const interval = setInterval(async () => {
        try {
          const res = await api.get(`/redemptions/status/${token}`);
          if (res.data?.status === 'COMPLETED') {
            setIsCompleted(true);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error checking status", err);
        }
      }, 3000);

      return () => {
        clearInterval(interval);
        backHandler.remove();
      };
    }

    return () => backHandler.remove();
  }, [token, isCompleted]);

  if (!token) return null;

  const props = {
    token, reward: reward || '', isCompleted, timeLeft, totpTimestamp, cancelling, handleCancel, theme, fadeAnim
  };

  if (theme.name === 'halloween') return <RewardQRHalloween {...props} />;
  if (theme.name === 'argentina') return <RewardQRArgentina {...props} />;

  return <RewardQRDefault {...props} />;
}
