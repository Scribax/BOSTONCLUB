import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, RefreshControl, Dimensions, Modal, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Skull, Moon, Ghost, Flame, ExternalLink, QrCode } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../../components/VideoPlayer';
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
import { EventData, EventsProps } from './types';

const { width: W, height: H } = Dimensions.get('window');
const CARD_HEIGHT = W * 0.7; // Taller for tombstone effect

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
// RITUAL CARD COMPONENT (Halloween Style)
// ─────────────────────────────────────────────
const RitualCard = ({ event, index, onPress, theme }: { event: EventData; index: number; onPress: () => void; theme: any }) => {
  const imgUri = resolveImageUrl(event.imageUrl);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }).toUpperCase();

  return (
    <Animated.View entering={FadeIn.delay(index * 100)} style={{ marginHorizontal: 20, marginBottom: 24 }}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ borderRadius: 40, overflow: 'hidden', backgroundColor: '#0a050f', borderWidth: 1, borderColor: `${theme.primary}40`, shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
        {/* Full-width image */}
        <View style={{ width: '100%', height: CARD_HEIGHT }}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#0d0714', alignItems: 'center', justifyContent: 'center' }}>
              <Moon size={40} color={`${theme.primary}40`} />
            </View>
          )}
          {/* Spooky Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(10,5,15,0.8)', '#0a050f']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: CARD_HEIGHT * 0.7 }}
          />

          {/* Top badge */}
          <View style={{ position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 }}>
            <View style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
              <Text style={{ color: 'black', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 2 }}>
                Ritual {index + 1}
              </Text>
            </View>
          </View>

          {/* Bottom text overlay */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
            <Text style={{ color: 'white', fontSize: 32, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -1, lineHeight: 34, textShadowColor: 'black', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }} numberOfLines={2}>
              {event.title}
            </Text>
            {event.description ? (
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }} numberOfLines={2}>
                {event.description}
              </Text>
            ) : null}

            {/* Info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Moon size={12} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
                  {formatDate(event.eventDate)}
                </Text>
              </View>
              {event.location ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ghost size={12} color="rgba(255,255,255,0.4)" />
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Bottom action strip */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: `${theme.primary}1A`, borderTopWidth: 1, borderTopColor: `${theme.primary}40` }}>
          <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
            LEER CONJURO
          </Text>
          <ArrowRight size={16} color={theme.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// RITUAL COUNTDOWN COMPONENT (Halloween Style)
// ─────────────────────────────────────────────
const RitualCountdown = ({ event, theme }: { event: EventData; theme: any }) => {
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
      <View style={{ backgroundColor: '#120a1a', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: `${theme.primary}66`, shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <View style={{ height: 1, flex: 1, backgroundColor: `${theme.primary}40` }} />
          <Flame size={14} color={theme.primary} style={{ marginHorizontal: 8 }} />
          <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>El Despertar</Text>
          <Flame size={14} color={theme.primary} style={{ marginHorizontal: 8 }} />
          <View style={{ height: 1, flex: 1, backgroundColor: `${theme.primary}40` }} />
        </View>
        
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 24 }}>
          {event.title}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {[
            { label: 'LUNAS', value: timeLeft.d },
            { label: 'HORAS', value: timeLeft.h },
            { label: 'MINS', value: timeLeft.m },
            { label: 'SEGS', value: timeLeft.s },
          ].map((item, i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <View style={{ backgroundColor: '#05020a', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: `${theme.primary}33`, minWidth: 64 }}>
                <Text style={{ color: 'white', fontSize: 32, fontWeight: '900', fontVariant: ['tabular-nums'], textAlign: 'center' }}>
                  {item.value.toString().padStart(2, '0')}
                </Text>
              </View>
              <Text style={{ color: theme.primary, fontSize: 9, fontWeight: '900', marginTop: 8, letterSpacing: 1 }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

export default function EventsHalloween({ events, loading, refreshing, onRefresh, theme }: EventsProps) {
  const router = useRouter();
  const { highlightId } = useLocalSearchParams();
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [redemptionLoading, setRedemptionLoading] = useState(false);

  const curtainAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });

  const headerImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [-100, 0, 100], [1.2, 1, 1], Extrapolate.CLAMP) },
      { translateY: interpolate(scrollY.value, [0, 100], [0, 30], Extrapolate.CLAMP) },
    ],
  }));

  // Auto-open highlighted event
  useEffect(() => {
    if (highlightId && events.length > 0 && !loading) {
      const found = events.find((ev) => ev.id === highlightId);
      if (found) handleOpenEvent(found);
    }
  }, [highlightId, events, loading]);

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

  const handleRedeem = async (event: EventData) => {
    try {
      setRedemptionLoading(true);
      const res = await api.post('/redemptions/generate', { eventId: event.id });
      
      handleCloseEvent();
      router.push({
        pathname: '/reward-qr',
        params: { token: res.data.qrToken, reward: event.title }
      });
    } catch (err: any) {
      Alert.alert('Maldición', err.response?.data?.message || 'Tus poderes son débiles para esto.');
    } finally {
      setRedemptionLoading(false);
    }
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
      <View style={{ flex: 1, backgroundColor: '#0a050f', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a050f' }}>
      <StatusBar style="light" />

      {/* Spooky Aura Background */}
      <View style={{ backgroundColor: theme.primary }} className={`absolute top-0 left-0 w-96 h-96 rounded-full opacity-10 blur-[120px]`} />

      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 24, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1 }}>RITUALES</Text>
          <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 4 }}>EL CLUB DEL TERROR</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}
      >
        {(() => {
          const nextEvent = [...events]
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
            .filter(e => new Date(e.eventDate).getTime() > new Date().getTime())[0];

          return nextEvent ? <RitualCountdown event={nextEvent} theme={theme} /> : null;
        })()}

        {events.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <Ghost size={60} color={`${theme.primary}40`} />
            <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 20, fontSize: 16, fontWeight: '900', fontStyle: 'italic' }}>El panteón está vacío</Text>
          </View>
        ) : (
          events.map((event, index) => (
            <RitualCard key={event.id} event={event} index={index} onPress={() => handleOpenEvent(event)} theme={theme} />
          ))
        )}
      </ScrollView>

      {/* ─── RITUAL DETAIL MODAL ─── */}
      {selectedEvent && (
        <Modal transparent visible={!!selectedEvent} animationType="none" onRequestClose={handleCloseEvent}>
          <View style={{ flex: 1, backgroundColor: '#0a050f' }}>

            {/* Content */}
            <Animated.View entering={FadeIn.delay(400)} style={{ flex: 1 }}>
              <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              >
                {/* Hero */}
                <View style={{ width: '100%', height: H * 0.55, position: 'relative', overflow: 'hidden' }}>
                  <Animated.Image
                    source={{ uri: resolveImageUrl(selectedEvent.secondaryImageUrl || selectedEvent.imageUrl) || '' }}
                    style={[{ width: '100%', height: '100%' }, headerImageStyle]}
                    resizeMode="cover"
                  />
                  <LinearGradient colors={['rgba(10,5,15,0.3)', 'rgba(10,5,15,0.85)', '#0a050f']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' }} />

                  {/* Back button */}
                  <TouchableOpacity onPress={handleCloseEvent} style={{ position: 'absolute', top: 54, left: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${theme.primary}66` }}>
                    <ArrowLeft size={24} color={theme.primary} />
                  </TouchableOpacity>

                  {/* Hero text */}
                  <View style={{ position: 'absolute', bottom: 40, left: 24, right: 24 }}>
                    <Animated.View entering={FadeIn.delay(600)} style={{ backgroundColor: theme.primary, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, marginBottom: 16 }}>
                      <Text style={{ color: 'black', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 2 }}>PRÓXIMO RITUAL</Text>
                    </Animated.View>
                    <Animated.Text entering={FadeIn.delay(700)} style={{ color: 'white', fontSize: 48, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -2, lineHeight: 50, textShadowColor: theme.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                      {selectedEvent.title}
                    </Animated.Text>
                    {selectedEvent.description ? (
                      <Animated.Text entering={FadeIn.delay(800)} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 12, lineHeight: 22 }}>
                        {selectedEvent.description}
                      </Animated.Text>
                    ) : null}
                  </View>
                </View>

                {/* Info bar */}
                <View style={{ marginTop: -20, paddingHorizontal: 20 }}>
                  <BlurView intensity={40} tint="dark" style={{ flexDirection: 'row', borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: `${theme.primary}4D`, backgroundColor: 'rgba(10,5,15,0.6)' }}>
                    {[
                      { icon: <Moon size={20} color={theme.primary} />, top: formatDate(selectedEvent.eventDate).split(' DE ')[0], bottom: formatDate(selectedEvent.eventDate).split(' DE ')[1] },
                      { icon: <Ghost size={20} color={theme.primary} />, top: `${formatTime(selectedEvent.eventDate)} HS`, bottom: 'INVOCACIÓN' },
                      { icon: <Skull size={20} color={theme.primary} />, top: (selectedEvent.location?.split(' ')[0] || 'BOSTON'), bottom: 'PANTEÓN' },
                    ].map((item, i, arr) => (
                      <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 20, borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: `${theme.primary}20` }}>
                        {item.icon}
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 12, marginTop: 8, textTransform: 'uppercase', textAlign: 'center' }}>{item.top}</Text>
                        <Text style={{ color: theme.primary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>{item.bottom}</Text>
                      </View>
                    ))}
                  </BlurView>
                </View>

                {/* Body */}
                <View style={{ padding: 24, gap: 32 }}>
                  {/* Secondary Video */}
                  {selectedEvent.secondaryMediaType === 'VIDEO' && selectedEvent.secondaryImageUrl && (
                    <Animated.View entering={FadeIn.delay(900)} style={{ borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: `${theme.primary}4D`, shadowColor: theme.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20 }}>
                      <VideoPlayer uri={resolveImageUrl(selectedEvent.secondaryImageUrl) || ''} style={{ width: '100%', height: 240 }} />
                    </Animated.View>
                  )}

                  {/* Details */}
                  {(selectedEvent.content || selectedEvent.details) && (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <Skull size={20} color={theme.primary} />
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 2 }}>El Conjuro</Text>
                      </View>
                      <View style={{ padding: 24, backgroundColor: '#120a1a', borderRadius: 32, borderWidth: 1, borderColor: `${theme.primary}33` }}>
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 28, fontStyle: 'italic' }}>
                          {selectedEvent.content || selectedEvent.details}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Benefits */}
                  {selectedEvent.benefits && (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <Flame size={20} color={theme.primary} />
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 2 }}>Sacrificio VIP</Text>
                      </View>
                      <LinearGradient colors={[`${theme.primary}33`, '#0a050f']} style={{ padding: 24, borderRadius: 32, borderWidth: 1, borderColor: theme.primary }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          <View style={{ padding: 12, backgroundColor: '#0a050f', borderRadius: 20, borderWidth: 1, borderColor: theme.primary }}>
                            <Ghost size={24} color={theme.primary} />
                          </View>
                          <Text style={{ flex: 1, color: 'white', fontSize: 17, fontStyle: 'italic', fontWeight: '900', lineHeight: 26 }}>
                            {selectedEvent.benefits}
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  )}

                  {/* CTA Buttons */}
                  <View style={{ gap: 16, marginTop: 8 }}>
                    {(selectedEvent as any).isRedeemable && (
                      <TouchableOpacity 
                        onPress={() => handleRedeem(selectedEvent)} 
                        disabled={redemptionLoading}
                        activeOpacity={0.9}
                      >
                        <LinearGradient colors={['#D4AF37', '#8A6D3B']} style={{ paddingVertical: 24, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, borderWidth: 1, borderColor: '#FFF' }}>
                          {redemptionLoading ? (
                            <ActivityIndicator color="black" />
                          ) : (
                            <>
                              <Text style={{ color: 'black', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 4, fontSize: 15, marginRight: 16 }}>
                                {selectedEvent.buttonText || '¡PACTAR AHORA!'}
                              </Text>
                              <QrCode size={20} color="black" />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {selectedEvent.externalLink && (
                      <TouchableOpacity onPress={() => Linking.openURL(selectedEvent.externalLink)} activeOpacity={0.9}>
                        <LinearGradient colors={[theme.primary, '#994000']} style={{ paddingVertical: 24, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 25, borderWidth: 1, borderColor: '#FFF' }}>
                          <Text style={{ color: 'black', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 4, fontSize: 15, marginRight: 16 }}>
                            {selectedEvent.buttonText || 'ASEGURAR ALMA'}
                          </Text>
                          <ExternalLink size={20} color="black" />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.ScrollView>
            </Animated.View>

            {/* Curtains - Darker for Halloween */}
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: H / 2, backgroundColor: '#05020a' }, topCurtainStyle]}>
              <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 32 }}>
                <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 60, fontStyle: 'italic', opacity: 0.05, letterSpacing: -2 }}>TERROR</Text>
              </View>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, height: H / 2, backgroundColor: '#05020a' }, bottomCurtainStyle]}>
              <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 32 }}>
                <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 14, opacity: 0.1, letterSpacing: 6 }}>RITUAL BOSTON</Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}
