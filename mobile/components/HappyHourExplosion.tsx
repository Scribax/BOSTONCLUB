import React, { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { Star, Sparkles, Zap, Flame, Trophy, Coins } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Variedad de íconos que caerán
const ICONS = [Star, Sparkles, Zap, Flame, Coins, Trophy];
// Colores representativos de los 3 temas (Oro, Celeste, Morado)
const COLORS = ['#D4AF37', '#75AADB', '#9333EA', '#FF4D4D', '#FFFFFF'];

const Particle = ({ delay, index }: { delay: number, index: number }) => {
  const Icon = ICONS[index % ICONS.length];
  const color = COLORS[index % COLORS.length];
  
  // Posición inicial aleatoria a lo ancho
  const initialX = Math.random() * width;
  const size = 12 + Math.random() * 20; // Tamaño entre 12 y 32

  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(initialX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Caída constante hacia abajo
    const fallDuration = 2500 + Math.random() * 2000;
    translateY.value = withDelay(
      delay, 
      withRepeat(withTiming(height + 100, { duration: fallDuration, easing: Easing.linear }), -1, false)
    );
    
    // Rotación girando constantemente
    rotation.value = withDelay(
      delay, 
      withRepeat(withTiming(360, { duration: 2000 + Math.random() * 2000, easing: Easing.linear }), -1, false)
    );
    
    // Aparece y desaparece suavemente
    opacity.value = withDelay(
      delay, 
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withDelay(fallDuration - 1500, withTiming(0, { duration: 1000 }))
        ), 
        -1, false
      )
    );
    
    // Movimiento de vaivén (sway) horizontal imitando hojas/confeti
    const swayAmount = 30 + Math.random() * 60;
    const swayDuration = 1000 + Math.random() * 1000;
    translateX.value = withDelay(
      delay, 
      withRepeat(
        withSequence(
          withTiming(initialX + swayAmount, { duration: swayDuration, easing: Easing.inOut(Easing.ease) }),
          withTiming(initialX - swayAmount, { duration: swayDuration, easing: Easing.inOut(Easing.ease) })
        ), 
        -1, true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value
  }));

  return (
    <Animated.View style={style}>
      <Icon size={size} color={color} fill={color} />
    </Animated.View>
  );
};

export default function HappyHourExplosion({ count = 30 }: { count?: number }) {
  const particles = Array.from({ length: count }).map((_, i) => ({
    id: i,
    // Distribuimos el inicio (delay) para que no caigan todos al mismo tiempo
    delay: Math.random() * 4000
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="none">
      {particles.map((p, i) => (
        <Particle key={p.id} delay={p.delay} index={i} />
      ))}
    </View>
  );
}
