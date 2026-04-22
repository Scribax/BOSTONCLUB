import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, Animated, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Crown, Star, Flame, Ticket, ArrowRight, User as UserIcon, MapPin, CreditCard, Gift, QrCode, History, X } from 'lucide-react-native';
import api, { getAuthToken, logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import DigitalCard from '../../components/DigitalCard';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  points: number;
  membershipLevel: string;
};

type BannerEvent = {
  id: string;
  title: string;
  description: string;
  benefits?: string;
  imageUrl?: string;
};

// Componente helper para animaciones optimizadas
const FadeInView = ({ delay = 0, children, className = "", style = {} }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        useNativeDriver: true, // Optimizado para celulares papa
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        useNativeDriver: true, // Optimizado para celulares papa
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      className={className}
      style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {children}
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CAROUSEL_WIDTH = SCREEN_WIDTH - 48; // SCREEN_WIDTH minus px-6 (24px * 2)
  const [user, setUser] = useState<UserData | null>(null);
  const [banners, setBanners] = useState<BannerEvent[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerEvent | null>(null);
  const [errorStatus, setErrorStatus] = useState<null | 'connection' | 'session'>(null);

  // FIX: New Architecture requiere que estas referencias sean estables (no recreadas en cada render)
  const onViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentBannerIdx(viewableItems[0].index ?? 0);
    }
  });
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });

  const loadProfile = async () => {
    try {
      setErrorStatus(null);
      const token = await getAuthToken();
      if (!token) {
        return;
      }
      const [userDataRes, eventsRes, settingsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/events').catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: null }))
      ]);
      
      setUser(userDataRes.data);
      setSettings(settingsRes.data);
      
      const filteredBanners = (eventsRes.data || []).filter((e: any) => e.type === "BANNER" && e.isActive !== false);
      setBanners(filteredBanners);
    } catch (err: any) {
      console.error('Load Profile Error:', err);
      // Solo mandamos al login si es un error de credenciales (401/403)
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorStatus('session');
        // Si la sesión expiró, forzamos el logout global para evitar loops
        await logout();
      } else {
        // Es un error de red o de servidor (500, Timeout, etc)
        setErrorStatus('connection');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resolveImageUrl = (url: string | undefined | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    
    const baseUrl = api.defaults.baseURL || 'https://mybostonclub.com/api';
    const rootUrl = baseUrl.replace(/\/api$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${rootUrl}${cleanUrl}`;
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permisos de notificaciones no otorgados');
        return;
      }
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? '3c50dc68-3e19-4218-a359-aca0431d7233'; // Expo EAS project ID
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
           projectId
        });
        token = pushTokenData.data;
        
        // Save to backend
        if (token) {
           await api.patch('/auth/push-token', { token }).catch(() => {});
        }
      } catch (e) {
        console.log('Error obteniendo Push Token (Normal en Expo Go):', e);
      }
    }
    return token;
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile().then(() => {
        // Ejecutar petición de notificaciones luego de cargar usuario
        registerForPushNotificationsAsync();
      });
    }, [])
  );



  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const calculateNextTier = () => {
    if (!user || !settings) return undefined;
    
    const pts = user.points;
    let nextTierName = "";
    let nextTierPts = 0;
    let currentTierPts = 0;

    if (pts < settings.goldThreshold) {
      nextTierName = "ORO";
      nextTierPts = settings.goldThreshold;
      currentTierPts = 0;
    } else if (pts < settings.platinumThreshold) {
      nextTierName = "PLATINO";
      nextTierPts = settings.platinumThreshold;
      currentTierPts = settings.goldThreshold;
    } else if (pts < settings.diamondThreshold) {
      nextTierName = "DIAMANTE";
      nextTierPts = settings.diamondThreshold;
      currentTierPts = settings.platinumThreshold;
    } else if (pts < settings.superVipThreshold) {
      nextTierName = "SÚPER VIP";
      nextTierPts = settings.superVipThreshold;
      currentTierPts = settings.diamondThreshold;
    } else {
      return undefined;
    }

    const progress = Math.min(100, Math.max(0, ((pts - currentTierPts) / (nextTierPts - currentTierPts)) * 100));
    
    return {
      name: nextTierName,
      pointsNeeded: nextTierPts,
      currentProgress: progress
    };
  };

  if (loading || (!user && !errorStatus)) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text className="text-white/50 uppercase font-black tracking-widest text-[10px] mt-4">Boston Club</Text>
      </View>
    );
  }

  if (errorStatus === 'connection') {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center px-10">
        <View className="w-20 h-20 bg-white/5 rounded-3xl items-center justify-center border border-white/10 mb-6">
          <Text className="text-4xl">📡</Text>
        </View>
        <Text className="text-white text-xl font-black italic uppercase tracking-tighter text-center mb-2">Error de conexión</Text>
        <Text className="text-white/40 text-[10px] font-bold text-center mb-10 leading-4 uppercase tracking-widest">
          No pudimos conectar con los servidores de Boston. Revisa tus datos móviles o WiFi.
        </Text>
        
        <TouchableOpacity 
          onPress={() => {
            setLoading(true);
            loadProfile();
          }}
          className="bg-boston-gold py-4 px-10 rounded-2xl shadow-lg shadow-boston-gold/20"
        >
          <Text className="text-black font-black uppercase text-xs tracking-widest">Reintentar Conexión</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={async () => {
            await api.post('/auth/logout').catch(() => {}); // Intentar avisar al server
            await logout();
          }}
          className="mt-6"
        >
          <Text className="text-white/20 font-bold uppercase text-[9px] tracking-widest underline">Cambiar de cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) return null; // Safety check

  const getAuraColor = () => {
    switch (user.membershipLevel) {
      case 'ORO': return 'bg-[#D4AF37]';
      case 'PLATINO': return 'bg-white';
      case 'DIAMANTE': return 'bg-cyan-400';
      case 'SÚPER VIP': return 'bg-[#FF3B30]';
      default: return 'bg-[#CC6633]';
    }
  };

  const banner = banners[currentBannerIdx];

  return (
    <View className="flex-1 bg-[#050505] relative">
      <StatusBar style="light" />
      
      {/* Background Aura */}
      <View className={`absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-[100px] ${getAuraColor()}`} />

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      >
        {/* Header */}
        <FadeInView delay={0} className="px-6 pt-20 pb-8 flex-row justify-between items-center z-10">
          <View>
            <Text className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mb-1">Membresía Premium</Text>
            <Text className="text-3xl font-black text-white italic uppercase tracking-tighter" numberOfLines={1}>{user.firstName}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            className="w-12 h-12 rounded-[1.2rem] bg-white/5 border border-white/10 items-center justify-center shadow-xl"
          >
            <UserIcon size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </FadeInView>

        <View className="px-6 flex-col gap-8 z-10">
          
          <FadeInView delay={100}>
            <DigitalCard 
               name={`${user.firstName} ${user.lastName}`}
               qrValue={user.id}
               points={user.points}
               level={user.membershipLevel}
               nextTier={calculateNextTier()}
               onPress={() => setShowBenefits(true)}
            />
          </FadeInView>

          {/* Info Blocks Row */}
          <FadeInView delay={200} className="flex-col gap-3">
             <Text className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] ml-2">
                Experiencia VIP Boston
             </Text>
             <View className="flex-row justify-between gap-3">
                <TouchableOpacity 
                   onPress={() => setShowGuide(true)}
                   className="flex-1 bg-white/[0.03] border border-white/5 py-5 px-2 rounded-[2rem] items-center justify-center"
                >
                   <Flame size={20} color="#ff4d4d" className="mb-2" />
                   <Text className="text-[10px] font-black text-white uppercase tracking-widest text-center">Niveles</Text>
                   <Text className="text-[7px] text-white/40 font-bold uppercase mt-1 tracking-widest">Saber más</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                   onPress={() => router.push('/events')}
                   className="flex-1 bg-white/[0.03] border border-white/5 py-5 px-2 rounded-[2rem] items-center justify-center"
                >
                   <Ticket size={20} color="#22D3EE" className="mb-2" />
                   <Text className="text-[10px] font-black text-white uppercase tracking-widest text-center">Próximos</Text>
                   <Text className="text-[7px] text-white/40 font-bold uppercase mt-1 tracking-widest">Cartelera</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => router.push('/rewards')}
                  className="flex-1 bg-white/[0.03] border border-white/5 py-5 px-2 rounded-[2rem] items-center justify-center"
                >
                  <Gift size={20} color="#D4AF37" className="mb-2" />
                  <Text className="text-[10px] font-black text-white uppercase tracking-widest text-center">Premios</Text>
                  <Text className="text-[7px] text-white/40 font-bold uppercase mt-1 tracking-widest">Ver Canjes</Text>
                </TouchableOpacity>
             </View>
          </FadeInView>

          {/* Flash Promo Banners Carousel */}
          {banners.length > 0 && (
            <FadeInView delay={400} className="px-6 mt-2">
              <FlatList
                data={banners}
                horizontal
                pagingEnabled
                style={{ width: CAROUSEL_WIDTH }}
                snapToInterval={CAROUSEL_WIDTH}
                decelerationRate="fast"
                disableIntervalMomentum={true}
                snapToAlignment="start"
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                getItemLayout={(_, index) => ({
                  length: CAROUSEL_WIDTH,
                  offset: CAROUSEL_WIDTH * index,
                  index,
                })}
                onViewableItemsChanged={onViewableItemsChangedRef.current}
                viewabilityConfig={viewabilityConfigRef.current}
                renderItem={({ item: slide }) => (
                  <TouchableOpacity
                    style={{ width: CAROUSEL_WIDTH }}
                    activeOpacity={0.9}
                    onPress={() => setSelectedBanner(slide)}
                  >
                    <View className={`rounded-[2.5rem] relative overflow-hidden shadow-2xl border border-white/10 ${!slide.imageUrl ? 'bg-[#5a0000]' : 'bg-[#111]'}`}>
                      {slide.imageUrl && (
                        <View className="absolute inset-0">
                          <Image source={{ uri: resolveImageUrl(slide.imageUrl) || '' }} className="w-full h-full opacity-50" resizeMode="cover" />
                          <View className="absolute inset-0 bg-black/50" />
                        </View>
                      )}
                      <View className="p-8 flex-row justify-between items-center z-10">
                          <View className="flex-1 mr-4">
                            <View className="bg-white/10 self-start px-3 py-1.5 rounded-full mb-3 border border-white/10">
                              <Text className="text-white/80 text-[7px] font-black uppercase tracking-[0.2em]">Novedades</Text>
                            </View>
                            <Text className="text-white font-black text-2xl italic tracking-tighter mb-1.5 uppercase drop-shadow-2xl" numberOfLines={2}>
                              {slide.title}
                            </Text>
                            <Text className="text-white/60 text-[10px] font-medium leading-4" numberOfLines={2}>
                              {slide.description}
                            </Text>
                          </View>
                          <View className="w-14 h-14 bg-white/10 rounded-[1.2rem] items-center justify-center border border-white/10 flex-shrink-0">
                            <Flame size={24} color="white" />
                          </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />

              {banners.length > 1 && (
                <View className="flex-row justify-center gap-2 mt-4">
                  {banners.map((_, idx) => (
                    <View 
                      key={idx}
                      style={{
                        height: 6,
                        width: idx === currentBannerIdx ? 24 : 8,
                        borderRadius: 3,
                        backgroundColor: idx === currentBannerIdx ? '#D4AF37' : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </View>
              )}
            </FadeInView>
          )}

          {/* History Link */}
          <FadeInView delay={500}>
            <TouchableOpacity 
              activeOpacity={0.8}
              className="bg-white/[0.02] p-6 rounded-3xl flex-row items-center border border-white/5"
              onPress={() => router.push('/history')} // FIX: Ahora lleva al historial de puntos
            >
               <View className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center mr-4">
                 <History size={20} color="rgba(255,255,255,0.4)" />
               </View>
               <View className="flex-1">
                  <Text className="text-xs font-black text-white uppercase tracking-[0.3em] mb-1">Actividad</Text>
                  <Text className="text-[9px] text-white/30 font-bold uppercase">Tus puntos y recompensas</Text>
               </View>
               <ArrowRight size={18} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          </FadeInView>

        </View>
      </ScrollView>

      {/* Guide Modal Modal */}
      <Modal visible={showGuide} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-center p-6">
           <View className="w-full bg-[#0d0d0d] border border-white/10 rounded-[40px] p-8 overflow-hidden">
              <View className="absolute top-0 right-0 w-32 h-32 bg-boston-red rounded-full opacity-10 blur-[60px]" />
              <View className="flex-row justify-between items-start mb-8 z-10">
                 <View className="flex-1 pr-4">
                    <Text className="text-2xl font-black text-white italic uppercase tracking-tighter" numberOfLines={1}>Guía Boston</Text>
                    <Text className="text-[9px] text-[#D4AF37] font-black uppercase tracking-[0.3em] mt-1" numberOfLines={1}>Cómo sumar y subir</Text>
                 </View>
                 <TouchableOpacity onPress={() => setShowGuide(false)} className="p-2 bg-white/5 rounded-full">
                    <X size={20} color="white" />
                 </TouchableOpacity>
              </View>

              <View className="flex-col gap-6">
                 <View>
                    <Text className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Regla de Oro</Text>
                    <View className="p-5 rounded-3xl bg-white/5 border border-white/5 flex-row items-center gap-4">
                       <Flame size={32} color="#ff4d4d" />
                       <View className="flex-1">
                          <Text className="text-xl font-black text-white italic" numberOfLines={1}>$1 = 1 PUNTO</Text>
                          <Text className="text-[9px] text-white/40 font-bold mt-1 uppercase leading-tight">Cada peso gastado es un punto para tu cuenta.</Text>
                       </View>
                    </View>
                 </View>

                 <View>
                    <Text className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Paso a paso</Text>
                    <View className="flex-col gap-4">
                      <View className="flex-row items-start gap-3">
                        <Text className="text-[#D4AF37] font-black italic text-xs mt-0.5">01</Text>
                        <Text className="text-[10px] text-white/70 font-medium leading-relaxed uppercase flex-1">Disfruta tu cena o bebida favorita en Boston.</Text>
                      </View>
                      <View className="flex-row items-start gap-3">
                        <Text className="text-[#D4AF37] font-black italic text-xs mt-0.5">02</Text>
                        <Text className="text-[10px] text-white/70 font-medium leading-relaxed uppercase flex-1">Al pagar, solicita tu código QR al staff o POSNET.</Text>
                      </View>
                      <View className="flex-row items-start gap-3">
                        <Text className="text-[#D4AF37] font-black italic text-xs mt-0.5">03</Text>
                        <Text className="text-[10px] text-white/70 font-medium leading-relaxed uppercase flex-1">Usa tu escáner para sumar puntos o pagar.</Text>
                      </View>
                    </View>
                 </View>
              </View>
           </View>
        </View>
      </Modal>

      {/* Benefits Modal */}
      <Modal visible={showBenefits} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
           <View className="w-full bg-[#0d0d0d] border-t border-white/10 rounded-t-[40px] p-8 max-h-[90%]">
              <View className="flex-row justify-between items-start mb-8">
                 <View className="flex-1 pr-4">
                    <Text className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Estatus Actual</Text>
                    <Text className="text-3xl font-black text-white italic uppercase tracking-tighter" numberOfLines={1}>Rango {user.membershipLevel}</Text>
                 </View>
                 <TouchableOpacity onPress={() => setShowBenefits(false)} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                    <X size={20} color="rgba(255,255,255,0.5)" />
                 </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                 <View className="flex-row items-center gap-3 mb-6">
                    <Crown size={20} color="#D4AF37" />
                    <Text className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex-1">Tus Privilegios Exclusivos</Text>
                 </View>
                 
                 <View className="flex-col gap-3">
                    {settings && (settings[`${user.membershipLevel.toLowerCase() === 'bronce' || user.membershipLevel.toLowerCase() === 'bronze' ? 'bronce' : (user.membershipLevel === 'ORO' ? 'gold' : (user.membershipLevel === 'PLATINO' ? 'platinum' : (user.membershipLevel === 'DIAMANTE' ? 'diamond' : 'superVip')))}Benefits`] || "- No hay beneficios configurados").split('\n').map((benefit: string, i: number) => (
                       <View key={i} className="flex-row items-center bg-white/[0.03] p-4 rounded-3xl border border-white/5 gap-4">
                          <View className="w-6 h-6 rounded-full bg-[#D4AF37]/10 items-center justify-center border border-[#D4AF37]/20 flex-shrink-0">
                             <View className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                          </View>
                          <Text className="flex-1 text-xs text-white/80 font-medium uppercase italic leading-tight">{benefit.replace(/^-\s*/, '')}</Text>
                       </View>
                    ))}
                 </View>

                 <View className="mt-10 pt-10 border-t border-white/5 flex-col gap-4">
                    <Text className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Próximas Metas</Text>
                    
                    {[
                      { name: "ORO", icon: "🥇", color: "text-boston-gold" },
                      { name: "PLATINO", icon: "💎", color: "text-white" },
                      { name: "DIAMANTE", icon: "💠", color: "text-cyan-400" },
                      { name: "SÚPER VIP", icon: "🔥", color: "text-boston-red-glow" },
                    ].filter(t => t.name !== user.membershipLevel).map((tier, idx) => (
                       <View key={idx} className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex-row items-center justify-between">
                          <View className="flex-row items-center gap-4">
                             <Text className="text-xl">{tier.icon}</Text>
                             <View>
                                <Text className={`text-[10px] font-black uppercase tracking-widest ${tier.color}`}>{tier.name}</Text>
                                <Text className="text-[8px] text-white/20 font-bold uppercase mt-1">Desbloquea más beneficios</Text>
                             </View>
                          </View>
                          <ArrowRight size={16} color="rgba(255,255,255,0.1)" />
                       </View>
                    ))}
                 </View>
              </ScrollView>
           </View>
        </View>
      </Modal>

      {/* Banner Detail Modal */}
      <Modal visible={!!selectedBanner} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center p-6">
          <View className="bg-[#0D0D0D] border border-boston-gold/20 rounded-[40px] overflow-hidden">
            {selectedBanner?.imageUrl && (
              <View className="w-full h-64 relative">
                <Image source={{ uri: resolveImageUrl(selectedBanner.imageUrl) || '' }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute inset-0 bg-black/30" />
              </View>
            )}
            
            <View className="p-8">
              <View className="flex-row justify-between items-start mb-6">
                <View className="flex-1 pr-4">
                  <View className="bg-boston-gold/10 self-start px-3 py-1 rounded-full mb-3 border border-boston-gold/20">
                    <Text className="text-boston-gold text-[8px] font-black uppercase tracking-widest">Novedad Especial</Text>
                  </View>
                  <Text className="text-3xl font-black text-white italic uppercase tracking-tighter">{selectedBanner?.title}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setSelectedBanner(null)}
                  className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
                >
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-[250px] mb-8" showsVerticalScrollIndicator={false}>
                <Text className="text-white/70 text-sm font-medium leading-relaxed uppercase">
                  {selectedBanner?.description}
                </Text>
                {selectedBanner?.benefits && (
                  <View className="mt-6 p-4 bg-boston-gold/5 border border-boston-gold/10 rounded-2xl">
                    <Text className="text-boston-gold text-[10px] font-black uppercase tracking-widest mb-2">🎁 Beneficio Club</Text>
                    <Text className="text-white/90 text-xs italic font-medium">{selectedBanner.benefits}</Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity 
                onPress={() => setSelectedBanner(null)}
                className="bg-boston-gold w-full py-5 rounded-[1.5rem] items-center shadow-lg"
              >
                <Text className="text-black font-black uppercase text-xs tracking-widest">Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
