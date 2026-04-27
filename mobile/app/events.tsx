import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, RefreshControl, Dimensions, Modal
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Clock, Star, ExternalLink } from 'lucide-react-native';
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
  withTiming,
  runOnJS,
  FadeIn,
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
  videoUrl?: string;
  mediaType?: string;
  benefits: string;
  buttonText: string;
  externalLink: string;
  content?: string;
  secondaryImageUrl?: string;
  secondaryMediaType?: string;
  linkedEventId?: string;
};

const { width: W, height: H } = Dimensions.get('window');
const CARD_HEIGHT = W * 0.62; // 16:10 ratio ish

const resolveImageUrl = (url: string | undefined | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const baseUrl = api.defaults.baseURL || 'https://mybostonclub.com/api';
  const rootUrl = baseUrl.replace(/\/api$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${rootUrl}${cleanUrl}`;
};

const ArrowRight = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

// ─────────────────────────────────────────────
// CARD COMPONENT
// ─────────────────────────────────────────────
const EventCard = ({ event, index, onPress }: { event: EventData; index: number; onPress: () => void }) => {
  const imgUri = resolveImageUrl(event.imageUrl);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }).toUpperCase();

  return (
    <Animated.View entering={FadeIn.delay(index * 100)} style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: '#111' }}>
        {/* Full-width image */}
        <View style={{ width: '100%', height: CARD_HEIGHT }}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={40} color="rgba(255,59,48,0.3)" />
            </View>
          )}
          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.97)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: CARD_HEIGHT * 0.65 }}
          />

          {/* Top badge */}
          <View style={{ position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 }}>
            <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1 }}>
                Evento {index + 1}
              </Text>
            </View>
          </View>

          {/* Bottom text overlay */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -1, lineHeight: 30 }} numberOfLines={2}>
              {event.title}
            </Text>
            {event.description ? (
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 }} numberOfLines={2}>
                {event.description}
              </Text>
            ) : null}

            {/* Info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Calendar size={11} color="#FF3B30" />
                <Text style={{ color: '#FF3B30', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
                  {formatDate(event.eventDate)}
                </Text>
              </View>
              {event.location ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <MapPin size={11} color="rgba(255,255,255,0.4)" />
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Bottom action strip */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(255,59,48,0.08)', borderTopWidth: 1, borderTopColor: 'rgba(255,59,48,0.2)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
            VER DETALLES
          </Text>
          <ArrowRight size={14} color="#FF3B30" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// F1 COUNTDOWN COMPONENT
// ─────────────────────────────────────────────
const F1Countdown = ({ event }: { event: EventData }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(event.eventDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [event.eventDate]);

  if (!timeLeft) return null;

  return (
    <Animated.View entering={FadeIn} style={{ marginHorizontal: 20, marginBottom: 30 }}>
      <View style={{ backgroundColor: '#111', borderRadius: 24, padding: 24, borderWidth: 2, borderColor: '#FF3B30', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <View style={{ h: 1, flex: 1, backgroundColor: 'rgba(255,59,48,0.2)' }} />
          <Text style={{ color: '#FF3B30', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginHorizontal: 12 }}>Próxima Carrera</Text>
          <View style={{ h: 1, flex: 1, backgroundColor: 'rgba(255,59,48,0.2)' }} />
        </View>
        
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 20 }}>
          {event.title}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {[
            { label: 'DÍAS', value: timeLeft.d },
            { label: 'HRS', value: timeLeft.h },
            { label: 'MIN', value: timeLeft.m },
            { label: 'SEG', value: timeLeft.s },
          ].map((item, i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <View style={{ backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minWidth: 60 }}>
                <Text style={{ color: 'white', fontSize: 32, fontWeight: '900', fontVariant: ['tabular-nums'], textAlign: 'center' }}>
                  {item.value.toString().padStart(2, '0')}
                </Text>
              </View>
              <Text style={{ color: '#FF3B30', fontSize: 8, fontWeight: '900', marginTop: 6 }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function EventsScreen() {
  const router = useRouter();
  const { highlightId } = useLocalSearchParams();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const curtainAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });

  const headerImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [-100, 0, 100], [1.2, 1, 1], Extrapolate.CLAMP) },
      { translateY: interpolate(scrollY.value, [0, 100], [0, 30], Extrapolate.CLAMP) },
    ],
  }));

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      const fetched = data.filter((e: any) => (e.type === 'EVENT' || e.type === 'EVENTO') && e.isActive !== false);
      setEvents(fetched);
      if (highlightId) {
        const found = fetched.find((ev: any) => ev.id === highlightId);
        if (found) handleOpenEvent(found);
      }
    } catch (err) { console.error(err); }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => { await fetchEvents(); setLoading(false); })();
      const iv = setInterval(fetchEvents, 60000);
      return () => clearInterval(iv);
    }, [highlightId])
  );

  const onRefresh = async () => { setRefreshing(true); await fetchEvents(); setRefreshing(false); };

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

  const topCurtainStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(curtainAnim.value, [0, 1], [0, -H / 2], Extrapolate.CLAMP) }],
  }));
  const bottomCurtainStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(curtainAnim.value, [0, 1], [0, H / 2], Extrapolate.CLAMP) }],
  }));

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }).toUpperCase();
  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF3B30" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 22, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1 }}>EVENTOS</Text>
          <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 3 }}>CARTELERA BOSTON</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3B30" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}
      >
        {events.length > 0 && (
          <F1Countdown event={[...events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()).filter(e => new Date(e.eventDate).getTime() > new Date().getTime())[0] || events[0]} />
        )}

        {events.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <Calendar size={48} color="rgba(255,59,48,0.3)" />
            <Text style={{ color: 'rgba(255,255,255,0.3)', marginTop: 16, fontSize: 14, fontWeight: '600' }}>No hay eventos próximos</Text>
          </View>
        ) : (
          events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} onPress={() => handleOpenEvent(event)} />
          ))
        )}
      </ScrollView>

      {/* ─── DETAIL MODAL ─── */}
      {selectedEvent && (
        <Modal transparent visible={!!selectedEvent} animationType="none" onRequestClose={handleCloseEvent}>
          <View style={{ flex: 1, backgroundColor: 'black' }}>

            {/* Content */}
            <Animated.View entering={FadeIn.delay(400)} style={{ flex: 1 }}>
              <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              >
                {/* Hero */}
                <View style={{ width: '100%', height: H * 0.52, position: 'relative', overflow: 'hidden' }}>
                  <Animated.Image
                    source={{ uri: resolveImageUrl(selectedEvent.secondaryImageUrl || selectedEvent.imageUrl) || '' }}
                    style={[{ width: '100%', height: '100%' }, headerImageStyle]}
                    resizeMode="cover"
                  />
                  <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)', 'black']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' }} />

                  {/* Back button */}
                  <TouchableOpacity onPress={handleCloseEvent} style={{ position: 'absolute', top: 54, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                    <ArrowLeft size={22} color="white" />
                  </TouchableOpacity>

                  {/* Hero text */}
                  <View style={{ position: 'absolute', bottom: 36, left: 24, right: 24 }}>
                    <Animated.View entering={FadeIn.delay(600)} style={{ backgroundColor: '#FF3B30', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginBottom: 14 }}>
                      <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1 }}>PRÓXIMO EVENTO</Text>
                    </Animated.View>
                    <Animated.Text entering={FadeIn.delay(700)} style={{ color: 'white', fontSize: 42, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -2, lineHeight: 44 }}>
                      {selectedEvent.title}
                    </Animated.Text>
                    {selectedEvent.description ? (
                      <Animated.Text entering={FadeIn.delay(800)} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 10, lineHeight: 20 }}>
                        {selectedEvent.description}
                      </Animated.Text>
                    ) : null}
                  </View>
                </View>

                {/* Info bar */}
                <View style={{ marginTop: -20, paddingHorizontal: 20 }}>
                  <BlurView intensity={30} tint="dark" style={{ flexDirection: 'row', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    {[
                      { icon: <Calendar size={18} color="#FF3B30" />, top: formatDate(selectedEvent.eventDate).split(' DE ')[0], bottom: formatDate(selectedEvent.eventDate).split(' DE ')[1] },
                      { icon: <Clock size={18} color="#FF3B30" />, top: `${formatTime(selectedEvent.eventDate)} HS`, bottom: 'PUERTAS' },
                      { icon: <MapPin size={18} color="#FF3B30" />, top: (selectedEvent.location?.split(' ')[0] || 'BOSTON'), bottom: 'LOCATION' },
                    ].map((item, i, arr) => (
                      <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 18, borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.06)' }}>
                        {item.icon}
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 11, marginTop: 6, textTransform: 'uppercase', textAlign: 'center' }}>{item.top}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{item.bottom}</Text>
                      </View>
                    ))}
                  </BlurView>
                </View>

                {/* Body */}
                <View style={{ padding: 24, gap: 28 }}>
                  {/* Secondary Video */}
                  {selectedEvent.secondaryMediaType === 'VIDEO' && selectedEvent.secondaryImageUrl && (
                    <Animated.View entering={FadeIn.delay(900)} style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                      <VideoPlayer uri={resolveImageUrl(selectedEvent.secondaryImageUrl) || ''} style={{ width: '100%', height: 220 }} />
                    </Animated.View>
                  )}

                  {/* Details */}
                  {(selectedEvent.content || selectedEvent.details) && (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <View style={{ width: 4, height: 16, backgroundColor: '#FF3B30', borderRadius: 2 }} />
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1 }}>Detalles del Evento</Text>
                      </View>
                      <View style={{ padding: 22, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 26 }}>
                          {selectedEvent.content || selectedEvent.details}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Benefits */}
                  {selectedEvent.benefits && (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <View style={{ width: 4, height: 16, backgroundColor: '#FF3B30', borderRadius: 2 }} />
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1 }}>Beneficios Socios</Text>
                      </View>
                      <LinearGradient colors={['rgba(255,59,48,0.18)', 'rgba(255,59,48,0.05)']} style={{ padding: 22, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,59,48,0.25)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                          <Star size={22} color="#FF3B30" fill="#FF3B30" />
                          <Text style={{ flex: 1, color: 'white', fontSize: 16, fontStyle: 'italic', fontWeight: '800', lineHeight: 24 }}>
                            {selectedEvent.benefits}
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  )}

                  {/* CTA Button */}
                  {selectedEvent.externalLink && (
                    <TouchableOpacity onPress={() => Linking.openURL(selectedEvent.externalLink)} activeOpacity={0.88} style={{ marginTop: 4 }}>
                      <LinearGradient colors={['#FF3B30', '#CC2E26']} style={{ paddingVertical: 22, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24 }}>
                        <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, fontSize: 14, marginRight: 12 }}>
                          {selectedEvent.buttonText || 'RESERVAR MESA'}
                        </Text>
                        <ExternalLink size={18} color="white" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.ScrollView>
            </Animated.View>

            {/* Curtains */}
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: H / 2, backgroundColor: 'black' }, topCurtainStyle]}>
              <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 24 }}>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 48, fontStyle: 'italic', opacity: 0.07, letterSpacing: -2 }}>BOSTON</Text>
              </View>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, height: H / 2, backgroundColor: 'black' }, bottomCurtainStyle]}>
              <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 24 }}>
                <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 12, opacity: 0.1, letterSpacing: 4 }}>AMERICAN BURGER</Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}
