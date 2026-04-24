import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Home, ScanLine, Gift, UserCircle } from 'lucide-react-native';
import { View, Text, Platform, Animated } from 'react-native';

// Animated Icon Wrapper for smooth feedback
const AnimatedTabIcon = ({ focused, color, Icon, label }: any) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
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
        height: '100%',
        width: 70,
        paddingTop: 10,
        transform: [{ scale: scaleAnim }]
      }}
    >
      <Icon size={22} color={color} />
      <Text 
        numberOfLines={1}
        style={{ 
          color, 
          fontSize: 8, 
          fontWeight: '900', 
          marginTop: 4, 
          letterSpacing: 0.5,
          opacity: focused ? 1 : 0.5
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
        sceneContainerStyle: { backgroundColor: '#050505' },
        animation: 'shift',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 25 : 12,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: '#000000',
          borderRadius: 35,
          height: 75,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          paddingBottom: Platform.OS === 'ios' ? 20 : 0,
          shadowColor: '#FF3B30',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
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
                top: -15,
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: '#FF3B30',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 5,
                borderColor: '#000',
                shadowColor: '#FF3B30',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 10,
                transform: [{ scale: focused ? 1.15 : 1 }]
              }}
            >
              <ScanLine size={28} color="#000" strokeWidth={3} />
              <Text style={{ color: '#000', fontSize: 8, fontStyle: 'italic', fontWeight: '900', marginTop: -2 }}>SCAN</Text>
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
