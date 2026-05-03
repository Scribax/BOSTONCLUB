import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { View, Text, Platform, Animated, Dimensions, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import api, { logout } from '../../lib/api';

// Silenciamos los warnings molestos de Reanimated durante el renderizado
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const { width } = Dimensions.get('window');

// Mapeo de iconos para evitar problemas de pasaje de componentes
const IconRenderer = ({ name, size, color, strokeWidth }: any) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
};

// Icono animado optimizado
const AnimatedTabIcon = ({ focused, color, iconName, label, totalTabs = 4 }: any) => {
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

  const tabWidth = (width - 32) / totalTabs; // 32 is the total horizontal margin (16 + 16)

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: tabWidth, height: 70 }}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          alignItems: 'center',
          opacity: opacityAnim,
        }}
      >
        <IconRenderer name={iconName} size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
        <Text
          numberOfLines={1}
          style={{
            color,
            fontSize: 8,
            fontWeight: '900',
            marginTop: 5,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </Animated.View>

      {/* Indicador rojo activo */}
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

// Botón SCAN flotante
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
    } catch (error) {}
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.88, friction: 4, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      style={{ top: -30, zIndex: 50, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View 
        style={{
          position: 'absolute',
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: '#FF2D2D',
          opacity: 0.15,
          transform: [{ scale: glowAnim }],
        }}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={['#FF3B30', '#FF2D2D', '#910000']}
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: '#050505',
          }}
        >
          <LucideIcons.Scan size={28} color="#000" strokeWidth={3} />
        </LinearGradient>
        <Text
          style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 8,
            fontWeight: '900',
            marginTop: 8,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          SCAN
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// Custom Tab Bar para tener control 100% absoluto sobre lo que se dibuja
const CustomTabBar = ({ state, descriptors, navigation, isAdmin }: any) => {
  // Filtramos estrictamente las rutas que queremos mostrar según el rol
  const visibleRoutes = state.routes.filter((route: any) => {
    if (isAdmin) {
      return ['staff-scanner', 'staff-history', 'staff-profile-placeholder'].includes(route.name);
    } else {
      return ['index', 'rewards', 'scanner', 'profile'].includes(route.name);
    }
  });

  return (
    <View style={{
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 30 : 20,
      left: 16,
      right: 16,
      height: 75,
      zIndex: 100
    }}>
      {/* FONDO (Con overflow hidden para respetar los bordes redondeados del Blur) */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: 35 }}>
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

      {/* BOTONES FRONTALES (Sin overflow hidden para que el ScanButton pueda salirse hacia arriba) */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {visibleRoutes.map((route: any, index: number) => {
          const isFocused = state.index === state.routes.findIndex((r: any) => r.key === route.key);
          
          const onPress = () => {
            if (route.name === 'staff-profile-placeholder') {
              Alert.alert("Modo Staff", "¿Deseas cerrar sesión?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Cerrar Sesión", style: "destructive", onPress: async () => {
                    await logout();
                    navigation.replace('login');
                }}
              ]);
              return;
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Configuramos los iconos según la ruta
          let iconName = '';
          let label = '';
          if (route.name === 'index') { iconName = 'Home'; label = 'INICIO'; }
          if (route.name === 'rewards') { iconName = 'Gift'; label = 'PREMIOS'; }
          if (route.name === 'profile') { iconName = 'UserCircle'; label = 'PERFIL'; }
          if (route.name === 'staff-scanner') { iconName = 'Scan'; label = 'SCAN'; }
          if (route.name === 'staff-history') { iconName = 'History'; label = 'HISTORIAL'; }
          if (route.name === 'staff-profile-placeholder') { iconName = 'LogOut'; label = 'SALIR'; }

          const totalTabs = visibleRoutes.length;

          if (route.name === 'scanner') {
            return (
              <View key={route.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ScanButton onPress={onPress} />
              </View>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={{ flex: 1 }}>
              <AnimatedTabIcon
                focused={isFocused}
                color={isFocused ? '#FF2D2D' : 'rgba(255,255,255,0.4)'}
                iconName={iconName}
                label={label}
                totalTabs={totalTabs}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default function TabLayout() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // useFocusEffect re-corre cada vez que este layout entra en foco,
  // incluso si el componente ya estaba montado en memoria (p.ej. tras cerrar sesión y volver)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setRole(null);

      const fetchUser = async () => {
        try {
          const res = await api.get('/auth/me');
          setRole(res.data.role);
        } catch (err: any) {
          if (err?.response?.status === 401) {
            router.replace('/login');
          } else {
            console.error("Layout Role Fetch Error", err);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }, [])
  );

  useEffect(() => {
    if (!loading && role) {
      const isStaff = role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'STAFF';
      if (isStaff) {
        setTimeout(() => {
          router.replace('/staff-scanner');
        }, 100);
      }
    }
  }, [loading, role]);


  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  const isAdmin = role?.toUpperCase() === 'ADMIN' || role?.toUpperCase() === 'STAFF';

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#050505' } }}
      tabBar={(props) => <CustomTabBar {...props} isAdmin={isAdmin} />}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="rewards" options={{ href: null }} />
      <Tabs.Screen name="scanner" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="staff-scanner" options={{ href: null }} />
      <Tabs.Screen name="staff-history" options={{ href: null }} />
      <Tabs.Screen name="staff-profile-placeholder" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}