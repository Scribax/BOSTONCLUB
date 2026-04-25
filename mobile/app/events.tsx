import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl, Dimensions, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Ticket, Calendar, MapPin, ExternalLink, ChevronDown, ChevronUp, PlayCircle, Star, X, Info, Bell, Clock, Map } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import api from '../lib/api';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../components/VideoPlayer';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Svg, Path } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler
} from 'react-native-reanimated';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const JaggedSeparator = () => (
  <View style={{ width: '100%', backgroundColor: 'black', height: 48, justifyContent: 'center' }}>
    <Svg height="48" width={SCREEN_WIDTH} viewBox={`0 0 ${SCREEN_WIDTH} 48`} preserveAspectRatio="none">
      <Path
        d={`M0 24 L${SCREEN_WIDTH * 0.45} 24 L${SCREEN_WIDTH * 0.5} 0 L${SCREEN_WIDTH * 0.55} 24 L${SCREEN_WIDTH} 24`}
        fill="none"
        stroke="white"
        strokeWidth="3"
      />
    </Svg>
  </View>
);

export default function EventsScreen() {
  const router = useRouter();
  const { highlightId } = useLocalSearchParams();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  
  const curtainAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

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
      const fetched = response.data.filter((e: any) => (e.type === "EVENT" || e.type === "EVENTO") && e.isActive !== false);
      setEvents(fetched);
      
      if (highlightId) {
        const found = fetched.find((ev: any) => ev.id === highlightId);
        if (found) handleOpenEvent(found);
      }
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
      const interval = setInterval(() => {
        fetchEvents();
      }, 60000);
      return () => clearInterval(interval);
    }, [highlightId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleOpenEvent = (event: EventData) => {
    setSelectedEvent(event);
    curtainAnim.value = withTiming(1, { duration: 500 });
  };

  const handleCloseEvent = () => {
    curtainAnim.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setSelectedEvent)(null);
      scrollY.value = 0;
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Animations
  const topCurtainStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(curtainAnim.value, [0, 1], [0, -SCREEN_HEIGHT / 2], Extrapolate.CLAMP) }]
  }));

  const bottomCurtainStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(curtainAnim.value, [0, 1], [0, SCREEN_HEIGHT / 2], Extrapolate.CLAMP) }]
  }));

  const headerImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [-100, 0, 100], [1.2, 1, 1], Extrapolate.CLAMP) },
      { translateY: interpolate(scrollY.value, [0, 100], [0, 30], Extrapolate.CLAMP) }
    ]
  }));

  if (loading && events.length === 0) {
     return (
       <View style={{ flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }}>
         <ActivityIndicator color="#FF3B30" size="large" />
       </View>
     );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar style="light" />
      
      {/* List Header */}
      <View style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24, backgroundColor: 'black', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        
        <View style={{ alignItems: 'center' }}>
           <Text style={{ color: 'white', fontWeight: '900', fontSize: 24, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1 }}>EVENTOS</Text>
           <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 2 }}>CARTELERA BOSTON</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3B30" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {events.map((event, index) => (
          <View key={event.id}>
             {index > 0 && <JaggedSeparator />}
             <TouchableOpacity activeOpacity={0.8} onPress={() => handleOpenEvent(event)} style={{ width: '100%', backgroundColor: 'black', minHeight: 180 }}>
                <View style={{ flexDirection: 'row', width: '100%' }}>
                   <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
                      <View style={{ backgroundColor: '#FF3B30', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, marginBottom: 8 }}>
                         <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>EVENTO {index + 1}</Text>
                      </View>
                      <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -1, lineHeight: 26, marginBottom: 4 }}>{event.title}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '500', marginBottom: 12 }} numberOfLines={2}>{event.description}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Calendar size={10} color="#FF3B30" />
                         <Text style={{ color: '#FF3B30', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginLeft: 6 }}>{formatDate(event.eventDate)}</Text>
                      </View>
                   </View>
                   <View style={{ width: '40%', position: 'relative' }}>
                      <Image source={{ uri: resolveImageUrl(event.imageUrl) || '' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <LinearGradient colors={['black', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%' }} />
                   </View>
                </View>
             </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* DETAIL MODAL WITH CURTAIN ANIMATION */}
      {selectedEvent && (
        <Modal transparent visible={!!selectedEvent} animationType="none" onRequestClose={handleCloseEvent}>
          <View style={{ flex: 1, backgroundColor: 'black' }}>
            {/* CONTENT (BEHIND CURTAIN) */}
            <Animated.View entering={FadeIn.delay(400)} style={{ flex: 1 }}>
              <Animated.ScrollView 
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 100 }}
              >
                {/* Hero Section with Parallax */}
                <View style={{ width: '100%', height: SCREEN_HEIGHT * 0.5, position: 'relative', overflow: 'hidden' }}>
                   <Animated.Image 
                     source={{ uri: resolveImageUrl(selectedEvent.secondaryImageUrl || selectedEvent.imageUrl) || '' }} 
                     style={[{ width: '100%', height: '100%' }, headerImageStyle]} 
                     resizeMode="cover" 
                   />
                   <LinearGradient 
                     colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'black']} 
                     style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' }} 
                   />
                   
                   <TouchableOpacity 
                     onPress={handleCloseEvent}
                     style={{ position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                   >
                     <ArrowLeft size={24} color="white" />
                   </TouchableOpacity>

                   <View style={{ position: 'absolute', bottom: 40, left: 24, right: 24 }}>
                      <Animated.View entering={FadeIn.delay(600)} style={{ backgroundColor: '#FF3B30', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, marginBottom: 16 }}>
                         <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1 }}>PRÓXIMO EVENTO</Text>
                      </Animated.View>
                      <Animated.Text entering={FadeIn.delay(700)} style={{ color: 'white', fontSize: 48, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -2, lineHeight: 48 }}>{selectedEvent.title}</Animated.Text>
                      <Animated.Text entering={FadeIn.delay(800)} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', marginTop: 12 }}>{selectedEvent.description}</Animated.Text>
                   </View>
                </View>

                {/* Info Bar - Glass Effect */}
                <View style={{ marginTop: -20, paddingHorizontal: 20 }}>
                   <BlurView intensity={30} tint="dark" style={{ flexDirection: 'row', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' }}>
                         <Calendar size={20} color="#FF3B30" />
                         <Text style={{ color: 'white', fontWeight: '900', fontSize: 11, marginTop: 6, textTransform: 'uppercase' }}>{formatDate(selectedEvent.eventDate).split(' DE ')[0]}</Text>
                         <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>{formatDate(selectedEvent.eventDate).split(' DE ')[1]}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' }}>
                         <Clock size={20} color="#FF3B30" />
                         <Text style={{ color: 'white', fontWeight: '900', fontSize: 11, marginTop: 6 }}>{formatTime(selectedEvent.eventDate)} HS</Text>
                         <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>PUERTAS</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}>
                         <MapPin size={20} color="#FF3B30" />
                         <Text style={{ color: 'white', fontWeight: '900', fontSize: 11, marginTop: 6, textAlign: 'center' }}>{selectedEvent.location?.split(' ')[0] || 'BOSTON'}</Text>
                         <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>LOCATION</Text>
                      </View>
                   </BlurView>
                </View>

                {/* Body Content */}
                <View style={{ padding: 24, gap: 30 }}>
                   {selectedEvent.secondaryMediaType === 'VIDEO' && selectedEvent.secondaryImageUrl && (
                      <Animated.View entering={FadeIn.delay(900)} style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 }}>
                         <VideoPlayer uri={resolveImageUrl(selectedEvent.secondaryImageUrl) || ''} style={{ width: '100%', height: 220 }} />
                      </Animated.View>
                   )}

                   {(selectedEvent.content || selectedEvent.details) && (
                      <View>
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <View style={{ width: 4, height: 14, backgroundColor: '#FF3B30' }} />
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1 }}>Detalles del Evento</Text>
                         </View>
                         <View style={{ padding: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 26, fontWeight: '400' }}>
                               {selectedEvent.content || selectedEvent.details}
                            </Text>
                         </View>
                      </View>
                   )}

                   {selectedEvent.benefits && (
                      <View>
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <View style={{ width: 4, height: 14, backgroundColor: '#FF3B30' }} />
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1 }}>Beneficios Socios</Text>
                         </View>
                         <LinearGradient 
                           colors={['rgba(255,59,48,0.15)', 'rgba(255,59,48,0.05)']} 
                           style={{ padding: 24, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' }}
                         >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                               <Star size={24} color="#FF3B30" fill="#FF3B30" />
                               <Text style={{ flex: 1, color: 'white', fontSize: 18, fontStyle: 'italic', fontWeight: '800', lineHeight: 26 }}>
                                  {selectedEvent.benefits}
                               </Text>
                            </View>
                         </LinearGradient>
                      </View>
                   )}

                   {selectedEvent.externalLink && (
                      <TouchableOpacity 
                        onPress={() => Linking.openURL(selectedEvent.externalLink)}
                        activeOpacity={0.9}
                        style={{ marginTop: 10 }}
                      >
                         <LinearGradient
                           colors={['#FF3B30', '#CC2E26']}
                           style={{ paddingVertical: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24 }}
                         >
                            <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, fontSize: 14, marginRight: 12 }}>{selectedEvent.buttonText || "RESERVAR MESA"}</Text>
                            <ArrowRight size={20} color="white" />
                         </LinearGradient>
                      </TouchableOpacity>
                   )}
                </View>
              </Animated.ScrollView>
            </Animated.View>

            {/* CURTAINS (TOP & BOTTOM) */}
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_HEIGHT / 2, backgroundColor: 'black', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }, topCurtainStyle]}>
               <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 48, fontStyle: 'italic', opacity: 0.1, letterSpacing: -2 }}>BOSTON</Text>
               </View>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT / 2, backgroundColor: 'black', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }, bottomCurtainStyle]}>
               <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 30 }}>
                  <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 12, opacity: 0.1, letterSpacing: 4 }}>AMERICAN BURGER</Text>
               </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const ArrowRight = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);
