import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Home, ScanLine, Gift, UserCircle } from 'lucide-react-native';
import { View, Text, Platform, Animated } from 'react-native';

// Animated Icon Wrapper for smooth feedback
const AnimatedTabIcon = ({ focused, color, Icon, label }: any) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.15 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View 
      style={{ 
        alignItems: 'center', 
        justifyContent: 'center', 
        minWidth: 65,
        transform: [{ scale: scaleAnim }]
      }}
    >
      <Icon size={20} color={color} />
      <Text 
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ 
          color, 
          fontSize: 7, 
          fontWeight: '900', 
          marginTop: 4, 
          letterSpacing: 0.2,
          opacity: focused ? 1 : 0.6
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Prevenir flashes al cambiar: seteamos el fondo del contenedor
        sceneContainerStyle: { backgroundColor: '#050505' },
        // Animación fluida de desplazamiento y fundido estilo nativo
        animation: 'shift',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 25 : 12,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          borderRadius: 30,
          height: 65,
          borderTopWidth: 0,
          paddingBottom: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
      }}>
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
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => (
            <View 
              style={{
                top: -12,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#D4AF37',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 4,
                borderColor: '#000',
                shadowColor: '#D4AF37',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 8,
                transform: [{ scale: focused ? 1.1 : 1 }]
              }}
            >
              <ScanLine size={24} color="#000" strokeWidth={3} />
              <Text style={{ color: '#000', fontSize: 7, fontWeight: '900', marginTop: -2 }}>SCAN</Text>
            </View>
          ),
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
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
