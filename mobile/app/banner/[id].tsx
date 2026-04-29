import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Animated, Linking, ActivityIndicator, LogBox, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { ArrowLeft, Gift, AlertCircle, Share2, Sparkles, ChevronDown, ArrowRight, QrCode, X, CheckCircle2, ShieldAlert, Calendar } from 'lucide-react-native';
import { VideoPlayer } from '../../components/VideoPlayer';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '../../components/FadeInView';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

const resolveImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // Clean potential /api at the end of baseURL if present
  const baseURL = api.defaults.baseURL || 'https://mybostonclub.com/api';
  const rootURL = baseURL.replace(/\/api$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${rootURL}${cleanUrl}`;
};

export default function BannerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 100;
  const HERO_HEIGHT = Dimensions.get('window').height * 0.65;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchBanner();
  }, [id]);

  const fetchBanner = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      const events = response.data;
      const found = events.find((e: any) => e.id === id);
      if (found) {
        if (found.gallery) {
           try { found.gallery = JSON.parse(found.gallery); } catch(e) {}
        }
        setBanner(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    try {
      setRedemptionLoading(true);
      const res = await api.post('/redemptions/generate', { eventId: id });
      
      router.push({
        pathname: '/reward-qr',
        params: { token: res.data.qrToken, reward: banner.title }
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al generar cupón');
    } finally {
      setRedemptionLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <Sparkles color="#D4AF37" size={32} className="mb-4" />
        <ActivityIndicator color="white" />
      </View>
    );
  }

  if (!banner) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <AlertCircle color="#ff4d4d" size={40} className="mb-4" />
        <Text className="text-black text-xl font-black uppercase italic mb-2">Ups! No hay nada aquí</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-boston-red px-8 py-4 rounded-2xl">
          <Text className="text-white font-black uppercase text-xs tracking-widest">VOLVER AL CLUB</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      
      {/* Dynamic Floating Header */}
      <Animated.View 
        style={{ 
          opacity: headerOpacity,
          height: HEADER_HEIGHT,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50
        }}
      >
        <BlurView intensity={80} tint="dark" style={{ flex: 1 }} />
        <View className="absolute inset-0 pt-12 px-6 flex-row items-center justify-between">
           <Text className="text-white text-lg font-black italic tracking-tighter uppercase">
            BOSTON <Text className="text-boston-red">CLUB</Text>
           </Text>
           <TouchableOpacity className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
              <Share2 color="white" size={18} />
           </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Back Button (Always visible but styled) */}
      <TouchableOpacity 
        onPress={() => router.back()}
        className="absolute top-12 left-6 z-[60] w-12 h-12 bg-black/30 rounded-full items-center justify-center border border-white/20"
      >
        <ArrowLeft color="white" size={24} />
      </TouchableOpacity>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {/* Cinematic Hero */}
        <View style={{ height: HERO_HEIGHT }} className="relative bg-black overflow-hidden">
          <Animated.View style={{ transform: [{ scale: headerScale }], flex: 1 }}>
            {banner.secondaryImageUrl ? (
              banner.secondaryMediaType === 'VIDEO' ? (
                <VideoPlayer
                  uri={resolveImageUrl(banner.secondaryImageUrl) || ''}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Image 
                  source={{ uri: resolveImageUrl(banner.secondaryImageUrl) }} 
                  className="w-full h-full opacity-90"
                  resizeMode="cover"
                />
              )
            ) : banner.mediaType === 'VIDEO' && banner.videoUrl ? (
              <VideoPlayer
                uri={resolveImageUrl(banner.videoUrl) || ''}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Image 
                source={{ uri: resolveImageUrl(banner.imageUrl) || '' }} 
                className="w-full h-full opacity-90"
                resizeMode="cover"
              />
            )}
          </Animated.View>

          {/* New Modern Gradient: Protects text without blocking center */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.95)']}
            className="absolute inset-0"
          />
          
          {/* Title moved to BOTTOM for a cleaner center look */}
          <View className="absolute bottom-16 w-full px-8">
             <FadeInView delay={200}>
                <View className="flex-row items-center mb-2">
                   <View className="h-[2px] w-8 bg-boston-red mr-3" />
                   <Text className="text-boston-red font-black text-[10px] uppercase tracking-[0.4em]">EXCLUSIVO</Text>
                </View>
                <Text className="text-white text-5xl font-black uppercase italic tracking-tighter leading-[48px]">
                  {banner.title}
                </Text>
                <Text className="text-white/60 text-base font-bold uppercase tracking-widest mt-2 leading-relaxed">
                  {banner.description}
                </Text>
             </FadeInView>
          </View>

          {/* Hint to scroll */}
          <View className="absolute bottom-6 w-full items-center">
             <ChevronDown color="white" size={20} className="opacity-30" />
          </View>
        </View>

        {/* Content Section - White, Clean, Spaced */}
        <View className="bg-white rounded-t-[40px] -mt-8 p-8 min-h-[500px] shadow-2xl">
           <FadeInView delay={300}>
              <View className="flex-row items-center justify-between mb-8">
                 <Text className="text-black text-2xl font-black uppercase italic tracking-tighter">
                   Detalles
                 </Text>
                 <View className="bg-black/5 px-4 py-2 rounded-full">
                    <Text className="text-black/40 font-black text-[8px] uppercase tracking-widest">
                       Ref: #{id.toString().slice(-4)}
                    </Text>
                 </View>
              </View>
              
              <Text className="text-black/80 text-lg font-medium leading-8 mb-10">
                {banner.content || 'Viví la experiencia definitiva en Boston Club. Un espacio diseñado para los que buscan lo mejor en gastronomía, eventos y beneficios exclusivos.'}
              </Text>

              {banner.benefits && (
                <View className="bg-boston-red rounded-[2.5rem] p-8 mb-12 shadow-xl shadow-boston-red/20">
                   <View className="flex-row items-center mb-4">
                      <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4">
                         <Sparkles color="white" size={20} />
                      </View>
                      <Text className="text-white font-black text-xs uppercase tracking-[0.2em]">Puntos & Beneficios</Text>
                   </View>
                   <Text className="text-white font-bold text-xl italic leading-7">{banner.benefits}</Text>
                </View>
              )}
           </FadeInView>

           {/* New Redemption Button Section */}
           {banner.isRedeemable && (
             <FadeInView delay={400} className="mb-12">
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={handleRedeem}
                  disabled={redemptionLoading}
                  className="bg-black py-6 rounded-[2rem] flex-row items-center justify-center shadow-2xl shadow-black/40 border border-white/10"
                >
                  {redemptionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <QrCode color="#D4AF37" size={24} className="mr-3" />
                      <Text className="text-white font-black text-sm uppercase tracking-[0.2em]">
                         {banner.buttonText || '¡LO QUIERO!'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
               <Text className="text-center text-[10px] text-black/20 font-bold uppercase mt-4 tracking-widest leading-relaxed">
                  {banner.redemptionPolicy === 'ONCE_PER_NIGHT' ? 'Válido una vez por noche' : 
                   banner.redemptionPolicy === 'ONCE_TOTAL' ? 'Un solo canje por socio' : 'Canje ilimitado disponible'}
               </Text>
             </FadeInView>
           )}

           {/* New: Linked Event Button */}
           {banner.linkedEventId && (
             <FadeInView delay={350} className="mb-12">
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/events', params: { highlightId: banner.linkedEventId } })}
                  className="bg-boston-gold py-6 rounded-[2rem] flex-row items-center justify-center shadow-xl shadow-boston-gold/20"
                >
                   <Calendar color="black" size={20} className="mr-3" />
                   <Text className="text-black font-black text-xs uppercase tracking-[0.2em]">IR AL EVENTO</Text>
                   <ArrowRight color="black" size={18} className="ml-2" />
                </TouchableOpacity>
             </FadeInView>
           )}

           {/* Gallery - Grid Style (Modern) */}
           {banner.gallery && Array.isArray(banner.gallery) && banner.gallery.length > 0 && (
             <View className="mt-4">
                <View className="flex-row items-center mb-8">
                   <Text className="text-black font-black uppercase text-sm tracking-widest italic">GALERÍA</Text>
                   <View className="flex-1 h-[1px] bg-black/5 ml-4" />
                </View>
                
                <View className="flex-row flex-wrap justify-between">
                   {banner.gallery.map((img: string, idx: number) => (
                     <FadeInView key={idx} delay={400 + (idx * 100)} className={`${idx % 3 === 0 ? 'w-full' : 'w-[48%]'} mb-4`}>
                        <TouchableOpacity 
                          activeOpacity={0.9}
                          className="h-64 rounded-[2rem] overflow-hidden bg-[#F5F5F5] border border-black/5"
                        >
                           <Image 
                             source={{ uri: resolveImageUrl(img) }} 
                             className="w-full h-full"
                             resizeMode="cover"
                           />
                        </TouchableOpacity>
                     </FadeInView>
                   ))}
                </View>
             </View>
           )}
           
           <View className="h-40" />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
