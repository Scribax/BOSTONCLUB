import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Home, Gift, UserCircle, Scan } from 'lucide-react-native';
import { View, Text, Platform, Animated, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Silenciamos los warnings molestos de Reanimated durante el renderizado
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const { width } = Dimensions.get('window');

// Icono animado con indicador rojo limpio (como en tu captura)
const AnimatedTabIcon = ({ focused, color, Icon, label }: any) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.05 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(focused ? -4 : 0)).current;
  const barWidth = useRef(new Animated.Value(focused ? 32 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: focused ? 1.08 : 1, friction: 8, tension: 100, useNativeDriver: true }),
      Animated.spring(translateYAnim, { toValue: focused ? -4 : 0, friction: 8, useNativeDriver: true }),
      Animated.spring(barWidth, { toValue: focused ? 32 : 0, friction: 10, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: focused ? 1 : 0.6, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: width / 5, height: 70 }}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          alignItems: 'center',
          opacity: opacityAnim,
        }}
      >
        <Icon size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
        <Text
          numberOfLines={1}
          style={{
            color,
            fontSize: 9,
            fontWeight: '900',
            marginTop: 5,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </Animated.View>

      {/* Indicador rojo activo con resplandor */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 4,
          height: 3,
          backgroundColor: '#FF2D2D',
          borderRadius: 2,
          width: barWidth,
          shadowColor: '#FF2D2D',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 6,
          elevation: 5,
        }}
      />
    </View>
  );
};

// Botón SCAN flotante con pulso y resplandor premium
const ScanButton = ({ onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePress = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      // Ignore haptics availability issues
    }
    onPress?.();
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.88, friction: 4, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ 
        top: -35, 
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Halo de luz animado */}
      <Animated.View 
        style={{
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#FF2D2D',
          opacity: 0.15,
          transform: [{ scale: glowAnim }],
        }}
      />
      
      <Animated.View 
        style={{ 
          transform: [{ scale: scaleAnim }],
          shadowColor: '#FF2D2D',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.65,
          shadowRadius: 18,
          elevation: 30,
        }}
      >
        <LinearGradient
          colors={['#FF3B30', '#FF2D2D', '#910000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 78,
            height: 78,
            borderRadius: 39,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 6,
            borderColor: '#050505',
          }}
        >
          <Scan size={32} color="#000" strokeWidth={3} />
          <Text
            style={{
              color: '#000',
              fontSize: 10,
              fontWeight: '900',
              letterSpacing: 1.5,
              marginTop: -2,
            }}
          >
            SCAN
          </Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#050505' },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 16,
          right: 16,
          height: 75,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, overflow: 'hidden', borderRadius: 35 }}>
            <BlurView
              intensity={80}
              tint="dark"
              style={{
                flex: 1,
                backgroundColor: 'rgba(10, 10, 10, 0.85)',
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 35,
              }}
            />
          </View>
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FF2D2D',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarItemStyle: {
          height: 75,
          paddingTop: 10,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} color={color} Icon={Home} label="INICIO" />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} color={color} Icon={Gift} label="PREMIOS" />
          ),
        }}
      />

      {/* SCAN CENTRAL */}
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarButton: (props) => <ScanButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} color={color} Icon={UserCircle} label="PERFIL" />
          ),
        }}
      />

      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}