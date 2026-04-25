import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Ticket, Calendar, MapPin, ExternalLink, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import api from '../lib/api';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../components/VideoPlayer';

type EventData = {
  id: string;
  title: string;
  description: string;
  details: string;
  location: string;
  eventDate: string;
  imageUrl: string;
  benefits: string;
  buttonText: string;
  externalLink: string;
  content?: string;
  secondaryImageUrl?: string;
  secondaryMediaType?: string;
  linkedEventId?: string;
};

export default function EventsScreen() {
  const router = useRouter();
  const { highlightId } = useLocalSearchParams();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>((highlightId as string) || null);

  const resolveImageUrl = (url: string | undefined | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseUrl = api.defaults.baseURL || 'https://mybostonclub.com/api';
    const rootUrl = baseUrl.replace(/\/api$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${rootUrl}${cleanUrl}`;
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      // Filtramos solo los eventos de tipo EVENT o EVENTO y que estén activos
      const fetched = response.data.filter((e: any) => (e.type === "EVENT" || e.type === "EVENTO") && e.isActive !== false);
      setEvents(fetched);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInitialEvents = async () => {
    try {
      await fetchEvents();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitialEvents();
      // Auto-refresh cada 60 segundos (los eventos no cambian frecuentemente)
      // El usuario puede hacer pull-to-refresh manualmente si necesita actualizar antes
      const interval = setInterval(() => {
        fetchEvents();
      }, 60000);
      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleOpenLink = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading && events.length === 0) {
     return (
       <View className="flex-1 bg-[#050505] items-center justify-center">
         <ActivityIndicator color="#D4AF37" size="large" />
       </View>
     );
  }

  return (
    <View className="flex-1 bg-[#050505] relative">
      <StatusBar style="light" />
      <View className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37] opacity-5 rounded-full blur-[100px]" />

      <View className="pt-16 pb-4 px-6 flex-row items-center border-b border-white/5 bg-[#050505]/90 z-20">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-12 h-12 bg-white/5 rounded-[1.2rem] items-center justify-center border border-white/10"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View className="ml-5 flex-1">
          <Text className="text-white font-black text-2xl italic uppercase tracking-tighter">Eventos</Text>
          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em]">Agenda VIP</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-6 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        showsVerticalScrollIndicator={false}
      >
        {events.length === 0 ? (
           <View className="items-center justify-center mt-32">
              <View className="w-24 h-24 bg-boston-gold/5 rounded-full items-center justify-center border border-boston-gold/10">
                <Ticket size={40} color="#D4AF37" style={{ opacity: 0.5 }} />
              </View>
              <Text className="text-[#D4AF37] mt-6 text-center tracking-[0.4em] text-[10px] uppercase font-black">Agenda Disponible Próximamente</Text>
           </View>
        ) : (
           events.map(event => (
             <TouchableOpacity 
               key={event.id}
               activeOpacity={0.95}
               onPress={() => toggleExpand(event.id)}
               className="w-full bg-[#0a0a0a] rounded-[2.5rem] border border-[#D4AF37]/20 mb-8 overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.05)] relative"
             >
                {event.imageUrl && (
                  <View className="w-full aspect-[4/3] bg-black relative">
                     <Image source={{ uri: resolveImageUrl(event.imageUrl) || '' }} className="w-full h-full opacity-80" resizeMode="cover" />
                     {/* Gradient Overlay for Text Readability */}
                     <View className="absolute inset-0" style={{ backgroundColor: 'rgba(5,5,5,0.4)' }} />
                     <View className="absolute bottom-0 left-0 right-0 h-40" style={{ backgroundColor: 'transparent' }} />
                  </View>
                )}
                
                <View className={`px-8 pb-8 pt-6 relative ${!event.imageUrl ? 'mt-2' : '-mt-24'}`}>
                   <View className="bg-[#D4AF37] self-start px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)] mb-4">
                      <Text className="text-black text-[8px] font-black uppercase tracking-[0.3em]">VIP Access</Text>
                   </View>

                   <Text className="text-white font-black text-3xl italic uppercase tracking-tighter drop-shadow-2xl mb-1">{event.title}</Text>
                   <Text className="text-white/80 text-[10px] uppercase font-bold tracking-[0.2em] leading-tight mb-6">{event.description}</Text>
                   
                   <View className="flex-col gap-4 mb-6 bg-white/[0.03] p-5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                      <View className="flex-row items-center gap-4">
                         <View className="w-8 h-8 rounded-full bg-[#D4AF37]/10 items-center justify-center border border-[#D4AF37]/20">
                            <Calendar size={14} color="#D4AF37" />
                         </View>
                         <View>
                            <Text className="text-white/40 text-[8px] uppercase tracking-widest font-black mb-1">Fecha Programada</Text>
                            <Text className="text-white text-xs font-black tracking-wider">{new Date(event.eventDate).toLocaleDateString()} - {new Date(event.eventDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                         </View>
                      </View>
                      
                      <View className="flex-row items-center gap-4">
                         <View className="w-8 h-8 rounded-full bg-[#D4AF37]/10 items-center justify-center border border-[#D4AF37]/20">
                            <MapPin size={14} color="#D4AF37" />
                         </View>
                         <View>
                            <Text className="text-white/40 text-[8px] uppercase tracking-widest font-black mb-1">Ubicación</Text>
                            <Text className="text-white text-xs font-black tracking-wider">{event.location}</Text>
                         </View>
                      </View>

                      {event.benefits && (
                        <View className="mt-2 pt-4 border-t border-white/5">
                           <Text className="text-[#D4AF37] text-[9px] uppercase font-black tracking-[0.2em] mb-2 flex-row items-center">✨ Beneficio Exclusivo</Text>
                           <Text className="text-white/90 text-sm italic font-medium">{event.benefits}</Text>
                        </View>
                      )}
                   </View>

                   {/* Expandable Details Section */}
                   {expandedId === event.id && (
                     <View className="mb-6 space-y-4">
                        {event.secondaryImageUrl && (
                          event.secondaryMediaType === 'VIDEO' ? (
                            <VideoPlayer 
                              uri={resolveImageUrl(event.secondaryImageUrl) || ''} 
                              style={{ width: '100%', height: 192, borderRadius: 16, marginBottom: 16 }} 
                            />
                          ) : (
                            <Image 
                              source={{ uri: resolveImageUrl(event.secondaryImageUrl) || '' }} 
                              className="w-full h-48 rounded-2xl mb-4" 
                              resizeMode="cover" 
                            />
                          )
                        )}
                        {(event.content || event.details) && (
                          <View className="p-5 bg-black/40 rounded-[2rem] border border-white/5">
                             <Text className="text-white/70 text-xs font-medium leading-loose">{event.content || event.details}</Text>
                          </View>
                        )}
                        {event.benefits && (
                          <View className="bg-boston-gold/10 p-5 rounded-[2rem] border border-boston-gold/20">
                             <Text className="text-boston-gold text-[9px] uppercase font-black tracking-widest mb-2">✨ Beneficio Incluido</Text>
                             <Text className="text-white/90 text-xs italic font-medium leading-relaxed">{event.benefits}</Text>
                          </View>
                        )}
                     </View>
                   )}

                   <View className="w-full flex-row items-center justify-between mt-2 pt-6 border-t border-white/10">
                     <View className="flex-row items-center bg-white/5 px-3 py-2 rounded-full">
                       {expandedId === event.id ? <ChevronUp size={14} color="#D4AF37" /> : <ChevronDown size={14} color="#D4AF37" />}
                       <Text className="text-[#D4AF37] text-[8px] font-black uppercase tracking-[0.2em] ml-2">
                          {expandedId === event.id ? 'Cerrar' : 'Info'}
                       </Text>
                     </View>

                     {event.externalLink && (
                       <TouchableOpacity 
                         onPress={(e) => { e.stopPropagation(); handleOpenLink(event.externalLink); }}
                         className="bg-[#D4AF37] rounded-2xl py-3 px-6 flex-row items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                       >
                          <Text className="text-black font-black uppercase tracking-[0.2em] text-[10px] mr-2">{event.buttonText || "Reservar"}</Text>
                          <ExternalLink size={14} color="black" />
                       </TouchableOpacity>
                     )}
                   </View>
                </View>
             </TouchableOpacity>
           ))
        )}
      </ScrollView>
    </View>
  );
}
