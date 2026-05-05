import React, { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withDelay, Easing } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const COLORS = ['#D4AF37', '#75AADB', '#9333EA', '#FF4D4D', '#FFFFFF', '#00FF88'];

// ─── Pre-calculado UNA sola vez al cargar el módulo. NUNCA se recalcula ────────
// Esto evita que React genere objetos nuevos en cada render causando GC pressure.
const PARTICLE_CONFIGS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: (width / 8) * i + 10,         // Distribuidos uniformemente, sin Math.random()
  size: 8 + (i % 3) * 4,           // 3 tamaños alternados: 8, 12, 16
  color: COLORS[i % COLORS.length],
  isCircle: i % 2 === 0,
  fallDuration: 3000 + (i % 4) * 600,   // 3000–5400ms, alternado
  rotateDuration: 1500 + (i % 3) * 500, // 1500–2500ms, alternado
  delay: (i * 500) % 3000,              // Escalonado, sin random
}));

// ─── Particle: solo 2 shared values (Y + rotate). React.memo evita re-renders ──
const Particle = React.memo(({ cfg }: { cfg: typeof PARTICLE_CONFIGS[0] }) => {
  const translateY = useSharedValue(-40);
  const rotation   = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      cfg.delay,
      withRepeat(
        withTiming(height + 60, { duration: cfg.fallDuration, easing: Easing.linear }),
        -1,
        false
      )
    );
    rotation.value = withDelay(
      cfg.delay,
      withRepeat(
        withTiming(360, { duration: cfg.rotateDuration, easing: Easing.linear }),
        -1,
        false
      )
    );

    return () => {
      // Cancelar animaciones al desmontar para liberar el hilo de Reanimated
      translateY.value = -40;
      rotation.value   = 0;
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: cfg.x,
    top: 0,
    width: cfg.size,
    height: cfg.isCircle ? cfg.size : cfg.size * 1.6,
    backgroundColor: cfg.color,
    borderRadius: cfg.isCircle ? cfg.size / 2 : 2,
    opacity: 0.85,
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return <Animated.View style={style} />;
});

// ─── Contenedor: zIndex alto, no bloquea gestos ────────────────────────────────
export default function HappyHourExplosion() {
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="none">
      {PARTICLE_CONFIGS.map(cfg => (
        <Particle key={cfg.id} cfg={cfg} />
      ))}
    </View>
  );
}
