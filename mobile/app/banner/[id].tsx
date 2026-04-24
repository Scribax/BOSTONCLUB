import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { apiFetch, resolveImageUrl } from '../../lib/api';
import { ArrowLeft, Gift, AlertCircle } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '../../components/FadeInView';

export default function BannerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanner();
  }, [id]);

  const fetchBanner = async () => {
    try {
      setLoading(true);
      const events = await apiFetch('/events');
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

  if (loading) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <Text className="text-boston-gold uppercase font-black tracking-widest text-xs">Cargando...</Text>
      </View>
    );
  }

  if (!banner) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center px-6">
        <AlertCircle color="#ff4d4d" size={40} className="mb-4" />
        <Text className="text-white text-xl font-black uppercase italic mb-2">Contenido no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-white/10 px-6 py-3 rounded-full">
          <Text className="text-white font-bold uppercase text-xs">Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505]">
      {/* Header Button (Absolute) */}
      <TouchableOpacity 
        onPress={() => router.back()}
        className="absolute top-14 left-6 z-50 w-12 h-12 bg-black/50 rounded-full items-center justify-center border border-white/10 backdrop-blur-md"
      >
        <ArrowLeft color="white" size={24} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Parallax Hero */}
        <View style={{ height: Dimensions.get('window').height * 0.55 }} className="relative">
          {banner.mediaType === 'VIDEO' && banner.videoUrl ? (
            <Video
              source={{ uri: resolveImageUrl(banner.videoUrl) || '' }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image 
              source={{ uri: resolveImageUrl(banner.imageUrl) || '' }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(5,5,5,0.8)', '#050505']}
            className="absolute inset-0 top-1/2"
          />
          
          <View className="absolute bottom-0 w-full px-6 pb-8">
             <FadeInView delay={100}>
                {banner.type === 'BANNER' && (
                  <View className="bg-boston-gold/10 self-start px-3 py-1.5 rounded-full mb-4 border border-boston-gold/20">
                    <Text className="text-boston-gold text-[9px] font-black uppercase tracking-widest">Contenido Exclusivo</Text>
                  </View>
                )}
                <Text className="text-white text-4xl font-black uppercase italic tracking-tighter leading-none mb-3">
                  {banner.title}
                </Text>
                <Text className="text-white/70 text-sm font-bold uppercase tracking-widest leading-relaxed">
                  {banner.description}
                </Text>
             </FadeInView>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-6 py-4">
           {banner.benefits && (
             <FadeInView delay={200} className="bg-boston-gold/5 border border-boston-gold/10 rounded-3xl p-6 mb-8">
                <View className="flex-row items-center gap-3 mb-3">
                   <Gift color="#D4AF37" size={20} />
                   <Text className="text-boston-gold font-black uppercase tracking-widest text-xs">Beneficio VIP</Text>
                </View>
                <Text className="text-white/90 font-medium italic text-sm">{banner.benefits}</Text>
             </FadeInView>
           )}

           {banner.content ? (
             <FadeInView delay={300} className="mb-10">
               {banner.content.split('\n').map((paragraph: string, index: number) => (
                 paragraph.trim() !== '' && (
                   <Text key={index} className="text-white/60 text-base mb-4 leading-[28px]">
                     {paragraph}
                   </Text>
                 )
               ))}
             </FadeInView>
           ) : null}
        </View>

        {/* Horizontal Gallery */}
        {banner.gallery && Array.isArray(banner.gallery) && banner.gallery.length > 0 && (
          <FadeInView delay={400} className="mb-20">
             <Text className="text-white font-black uppercase tracking-widest text-xs px-6 mb-6 italic">Galería</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
                {banner.gallery.map((img: string, idx: number) => (
                  <View key={idx} className="w-64 h-80 rounded-[2rem] overflow-hidden border border-white/5 bg-white/5">
                    <Image 
                      source={{ uri: resolveImageUrl(img) }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                ))}
             </ScrollView>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}
