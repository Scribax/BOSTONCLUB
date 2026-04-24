import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, Animated, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Crown, Star, Flame, Ticket, ArrowRight, User as UserIcon, MapPin, CreditCard, Gift, QrCode, History, X, Calendar, TrendingUp } from 'lucide-react-native';
import api, { getAuthToken, logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Dimensions, LogBox } from 'react-native';
import { initNotifications, registerForPushNotificationsAsync } from '../../lib/notificationHelper';
import { VideoPlayer } from '../../components/VideoPlayer';
import { FadeInView } from '../../components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
  '[Reanimated] Writing to `value` during component render'
]);

// Initialize notifications configuration
initNotifications();

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
  videoUrl?: string;
  mediaType: 'IMAGE' | 'VIDEO';
};

// Componente helper para animaciones optimizadas removido de acá y movido a components/FadeInView.tsx

export default function DashboardScreen() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CAROUSEL_WIDTH = SCREEN_WIDTH - 48; // SCREEN_WIDTH minus px-6 (24px * 2)
  const [user, setUser] = useState<UserData | null>(null);
  const [banners, setBanners] = useState<BannerEvent[]>([]);
  const [promoBanners, setPromoBanners] = useState<BannerEvent[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [currentPromoIdx, setCurrentPromoIdx] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
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
      
      const allEvents = eventsRes.data || [];
      const topBanners = allEvents.filter((e: any) => e.type === "BANNER" && e.isActive !== false);
      const bottomPromos = allEvents.filter((e: any) => e.type === "PROMO" && e.isActive !== false);
      
      setBanners(topBanners);
      setPromoBanners(bottomPromos);
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

  useFocusEffect(
    useCallback(() => {
      loadProfile().then(() => {
        // Ejecutar petición de notificaciones luego de cargar usuario (si no es Expo Go)
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
        className="flex-1 bg-[#050505]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      >
        {/* Header & Hero Carousel Section */}
        <View className="relative">
          {/* Top Bar Overlay */}
          <View className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 pt-16">
            <View className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
               <Text className="text-white font-black text-[10px] tracking-widest uppercase italic">Boston Club</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              className="w-11 h-11 rounded-full bg-black/40 border border-white/10 items-center justify-center shadow-2xl backdrop-blur-md"
            >
              <UserIcon size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Hero Carousel */}
          <View style={{ height: Dimensions.get('window').height * 0.75 }}>
             <FlatList
                data={banners.length > 0 ? banners : [{ id: 'empty', title: 'Bienvenido', description: 'Cargando novedades...', mediaType: 'IMAGE' } as any]}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChangedRef.current}
                viewabilityConfig={viewabilityConfigRef.current}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
                    style={{ width: Dimensions.get('window').width, height: '100%' }} 
                    className="relative bg-[#0c0c0c]"
                  >
                    {item.mediaType === 'VIDEO' && item.videoUrl ? (
                      <VideoPlayer
                        uri={resolveImageUrl(item.videoUrl) || ''}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <Image 
                        source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=1000' }} 
                        className="w-full h-full opacity-70"
                        resizeMode="cover"
                      />
                    )}
                    
                    {/* Gradient Overlay */}
                    <View className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30" />

                    {/* Banner Content Overlay */}
                    <View className="absolute bottom-24 left-0 right-0 px-8">
                       <FadeInView delay={300}>
                          <View className="bg-white px-4 py-2 rounded-sm self-start mb-4 shadow-2xl">
                             <Text className="text-black font-black text-xs uppercase italic tracking-tighter">
                               ¡HOLA, {user.firstName.toUpperCase()}!
                             </Text>
                          </View>
                          <Text className="text-white text-5xl font-black uppercase italic tracking-tighter leading-[42px] mb-2 drop-shadow-2xl">
                             {item.title}
                          </Text>
                          <Text className="text-white/70 text-sm font-bold uppercase tracking-widest">
                             {item.description}
                          </Text>
                          <View className="bg-boston-gold/20 self-start px-3 py-1.5 rounded-full mt-4 border border-boston-gold/30">
                             <Text className="text-boston-gold font-black text-[8px] tracking-widest uppercase">Toca para ver más</Text>
                          </View>
                       </FadeInView>
                    </View>
                  </TouchableOpacity>
                )}
             />
             
             {/* Pagination Dots */}
             <View className="absolute bottom-16 w-full flex-row justify-center gap-2">
                {banners.map((_, idx) => (
                  <View key={idx} className={`h-1 rounded-full transition-all ${idx === currentBannerIdx ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
                ))}
             </View>
          </View>
        </View>

        {/* Floating Tier Card - New Skeuomorphic Style */}
          <FadeInView delay={500} className="px-6 -mt-12 z-50">
             <TouchableOpacity 
               activeOpacity={0.9}
               onPress={() => setShowBenefits(true)}
               style={{
                 shadowColor: '#ff0000',
                 shadowOffset: { width: 0, height: 10 },
                 shadowOpacity: 0.2,
                 shadowRadius: 20,
                 elevation: 10
               }}
               className="bg-[#0a0a0a] rounded-[2.5rem] p-6 border border-white/5"
             >
                {/* Header Section */}
                <View className="flex-row justify-between items-start mb-6">
                   <View className="flex-row items-center">
                      {/* Round Logo Placeholder */}
                      <View className="w-14 h-14 rounded-full bg-black border-2 border-white/10 items-center justify-center mr-4">
                         <View className="items-center justify-center">
                            <Text className="text-white text-[8px] font-black italic tracking-tighter leading-none">BOSTON</Text>
                            <View className="h-[1px] w-8 bg-boston-red my-0.5" />
                            <Crown size={12} color="#D4AF37" />
                         </View>
                      </View>
                      
                      <View>
                         <Text className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-1 italic">NIVEL</Text>
                         <Text className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none">
                            {user.membershipLevel.toUpperCase()}
                         </Text>
                         <View className="flex-row items-center mt-2">
                            <View className="h-[1px] flex-1 bg-boston-red/30" />
                            <Star size={8} color="white" fill="white" className="mx-2" />
                            <View className="h-[1px] flex-1 bg-boston-red/30" />
                         </View>
                      </View>
                   </View>

                   {/* Points Pill */}
                   <View className="bg-black border border-boston-red/30 rounded-2xl p-2 flex-row items-center px-4 shadow-lg shadow-boston-red/20">
                      <View className="w-8 h-8 bg-boston-red rounded-full items-center justify-center mr-3">
                         <Star size={14} color="white" fill="white" />
                      </View>
                      <View>
                         <Text className="text-white font-black text-xl italic tracking-tighter leading-none">{user.points}</Text>
                         <Text className="text-boston-red font-black text-[8px] uppercase tracking-widest mt-0.5">PUNTOS</Text>
                      </View>
                      <ArrowRight size={12} color="white" className="ml-3 opacity-30" />
                   </View>
                </View>

                {/* New 3D Progress Bar */}
                <View className="relative mb-6">
                   <View className="h-4 bg-black rounded-full w-full border border-white/5 overflow-hidden">
                      {/* Track Background Texture */}
                      <View className="absolute inset-0 opacity-20 flex-row">
                         {[...Array(20)].map((_, i) => (
                           <View key={i} className="w-1 h-full bg-white/20 mr-4 -rotate-45" />
                         ))}
                      </View>
                      
                      {/* Progress Fill with Gloss */}
                      <View 
                        style={{ width: `${calculateNextTier()?.currentProgress || 100}%` }} 
                        className="absolute top-0 left-0 h-full"
                      >
                         <LinearGradient
                           colors={['#ff4d4d', '#cc0000', '#990000']}
                           start={{ x: 0, y: 0 }}
                           end={{ x: 0, y: 1 }}
                           style={{ flex: 1, borderRadius: 10 }}
                         />
                         {/* Gloss Overlay */}
                         <View className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 rounded-full mx-1 mt-0.5" />
                      </View>
                   </View>
                   
                   {/* Progress Thumb - Burger Icon Style */}
                   <View 
                     style={{ left: `${(calculateNextTier()?.currentProgress || 100) - 2}%` }}
                     className="absolute top-[-4px] w-6 h-6 rounded-full bg-boston-red border-2 border-[#1a1a1a] items-center justify-center shadow-xl shadow-boston-red/50"
                   >
                      <View className="w-2.5 h-0.5 bg-white rounded-full mb-0.5" />
                      <View className="w-3.5 h-1 bg-boston-gold rounded-sm mb-0.5" />
                      <View className="w-3 h-0.5 bg-white rounded-full" />
                   </View>
                </View>
                
                {/* Milestones */}
                <View className="flex-row justify-between px-2">
                   <View className="items-center">
                      <Star size={10} color={user.points >= 0 ? '#D4AF37' : '#333'} fill={user.points >= 0 ? '#D4AF37' : 'transparent'} className="mb-2" />
                      <Text className={`text-[10px] font-black uppercase italic ${user.points >= 0 ? 'text-white' : 'text-white/20'}`}>CLÁSICO</Text>
                   </View>
                   <View className="items-center">
                      <Star size={10} color={user.points >= 5000 ? '#D4AF37' : '#333'} fill={user.points >= 5000 ? '#D4AF37' : 'transparent'} className="mb-2" />
                      <Text className={`text-[10px] font-black uppercase italic ${user.points >= 5000 ? 'text-white' : 'text-white/20'}`}>FAN</Text>
                   </View>
                   <View className="items-center">
                      <Star size={10} color={user.points >= 20000 ? '#D4AF37' : '#333'} fill={user.points >= 20000 ? '#D4AF37' : 'transparent'} className="mb-2" />
                      <Text className={`text-[10px] font-black uppercase italic ${user.points >= 20000 ? 'text-white' : 'text-white/20'}`}>MEGA FAN</Text>
                   </View>
                </View>
             </TouchableOpacity>
          </FadeInView>
          {/* New Premium Action Grid */}
        <View className="px-6 mt-12">
           <View className="flex-row items-center justify-center mb-8">
              <View className="h-[1px] w-8 bg-white/10" />
              <Star size={8} color="#FF3B30" fill="#FF3B30" className="mx-3" />
              <Text className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Menú Boston VIP</Text>
              <Star size={8} color="#FF3B30" fill="#FF3B30" className="mx-3" />
              <View className="h-[1px] w-8 bg-white/10" />
           </View>
           
           <View className="flex-row justify-between">
              {/* Rewards Card */}
              <TouchableOpacity 
                onPress={() => router.push('/rewards')}
                activeOpacity={0.8}
                className="w-[31%] aspect-[0.7] bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-4 items-center justify-between shadow-2xl shadow-black"
              >
                 <View className="w-12 h-12 rounded-2xl border border-[#FF3B30]/30 items-center justify-center bg-white/5">
                    <Gift size={24} color="#FF3B30" />
                 </View>
                 <View className="items-center">
                    <Text className="text-white font-black uppercase text-[10px] tracking-wider mb-1">Premios</Text>
                    <Text className="text-white/30 font-bold uppercase text-[7px] text-center">Canjea tus puntos</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-boston-red items-center justify-center">
                    <ArrowRight size={14} color="white" />
                 </View>
              </TouchableOpacity>

              {/* Agenda Card */}
              <TouchableOpacity 
                onPress={() => router.push('/events')}
                activeOpacity={0.8}
                className="w-[31%] aspect-[0.7] bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-4 items-center justify-between shadow-2xl shadow-black"
              >
                 <View className="w-12 h-12 rounded-2xl border border-[#FF3B30]/30 items-center justify-center bg-white/5 relative">
                    <Calendar size={24} color="#FF3B30" />
                    <View className="absolute top-1 right-1">
                       <Star size={8} color="#FF3B30" fill="#FF3B30" />
                    </View>
                 </View>
                 <View className="items-center">
                    <Text className="text-white font-black uppercase text-[10px] tracking-wider mb-1">Agenda</Text>
                    <Text className="text-white/30 font-bold uppercase text-[7px] text-center">Eventos y promos</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-boston-red items-center justify-center">
                    <ArrowRight size={14} color="white" />
                 </View>
              </TouchableOpacity>

              {/* Activity Card */}
              <TouchableOpacity 
                onPress={() => router.push('/history')}
                activeOpacity={0.8}
                className="w-[31%] aspect-[0.7] bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-4 items-center justify-between shadow-2xl shadow-black"
              >
                 <View className="w-12 h-12 rounded-2xl border border-[#FF3B30]/30 items-center justify-center bg-white/5">
                    <TrendingUp size={24} color="#FF3B30" />
                 </View>
                 <View className="items-center">
                    <Text className="text-white font-black uppercase text-[10px] tracking-wider mb-1">Actividad</Text>
                    <Text className="text-white/30 font-bold uppercase text-[7px] text-center">Tus movimientos</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-boston-red items-center justify-center">
                    <ArrowRight size={14} color="white" />
                 </View>
              </TouchableOpacity>
           </View>
        </View>

        {/* Promos Destacadas Section - Bottom Placement */}
        {promoBanners.length > 0 && (
           <View className="mt-12 mb-8">
              <View className="px-6 flex-row justify-between items-end mb-6">
                 <View>
                    <Text className="text-white/20 font-black text-[8px] uppercase tracking-[0.4em] mb-1">Especiales de hoy</Text>
                    <Text className="text-white text-2xl font-black uppercase italic tracking-tighter">Promos Destacadas</Text>
                 </View>
                 <TouchableOpacity className="flex-row items-center bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <Text className="text-boston-red font-black text-[9px] uppercase tracking-widest mr-2">Ver Todas</Text>
                    <ArrowRight size={10} color="#FF3B30" />
                 </TouchableOpacity>
              </View>

              <View style={{ height: 180 }}>
                 <FlatList
                    data={promoBanners}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                    snapToInterval={SCREEN_WIDTH * 0.85 + 16}
                    decelerationRate="fast"
                    onScroll={(e) => {
                       const x = e.nativeEvent.contentOffset.x;
                       const idx = Math.round(x / (SCREEN_WIDTH * 0.85 + 16));
                       setCurrentPromoIdx(idx);
                    }}
                    renderItem={({ item }: { item: any }) => (
                      <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
                        style={{ width: SCREEN_WIDTH * 0.85, height: 160 }} 
                        className="relative bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl"
                      >
                        {/* Card Content Layout */}
                        <View className="flex-1 flex-row">
                           {/* Text Content (Left) */}
                           <View className="flex-1 p-6 justify-center">
                              <Text className="text-white text-4xl font-black uppercase italic tracking-tighter mb-1">
                                 {item.title}
                              </Text>
                              <Text className="text-white/80 font-black uppercase text-[10px] tracking-widest mb-4">
                                 {item.description}
                              </Text>
                              <View className="bg-white/10 self-start px-2 py-1 rounded-md">
                                 <Text className="text-white/40 font-bold uppercase text-[7px] tracking-widest">
                                    {item.condition || 'Válido hoy'}
                                 </Text>
                              </View>
                           </View>

                           {/* Image Content (Right) */}
                           <View className="w-[45%] h-full">
                              <Image 
                                source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500' }} 
                                className="w-full h-full"
                                resizeMode="cover"
                              />
                              {/* Gradient to blend image with text area */}
                              <LinearGradient
                                 colors={['#0c0c0c', 'transparent']}
                                 start={{ x: 0, y: 0.5 }}
                                 end={{ x: 0.8, y: 0.5 }}
                                 style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%' }}
                              />
                           </View>
                        </View>
                      </TouchableOpacity>
                    )}
                 />
              </View>
              
              {/* Pagination Dots - Redesigned */}
              <View className="flex-row justify-center gap-2 mt-4">
                 {promoBanners.map((_, idx) => (
                   <View 
                     key={idx} 
                     className={`h-1.5 rounded-full transition-all ${idx === currentPromoIdx ? 'w-8 bg-boston-red' : 'w-2 bg-white/10'}`} 
                   />
                 ))}
              </View>
           </View>
        )}
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


    </View>
  );
}
