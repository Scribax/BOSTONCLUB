import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Image, Modal, useWindowDimensions, FlatList,
} from 'react-native';
import {
  Trophy, Star, MapPin, ClipboardList, ArrowRight,
  User as UserIcon, X, Zap, ChevronRight,
} from 'lucide-react-native';
import { VideoPlayer } from '../../components/VideoPlayer';
import { StatusBar } from 'expo-status-bar';
import { FadeInView } from '../../components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';
import { VipStatusModal } from '../VipStatusModal';
import { DashboardProps } from './types';
import { logout } from '../../lib/api';

// ── Colores del kit Argentina ──────────────────────────────────────────
const CELESTE  = '#75AADB';
const GOLD     = '#F0C040';
const NAVY     = '#020B1A';
const NAVY_MID = '#060D18';

// ── Componente pill de stat ────────────────────────────────────────────
const StatPill = ({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) => (
  <View style={{
    backgroundColor: accent ? `${CELESTE}1A` : 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: accent ? `${CELESTE}44` : 'rgba(255,255,255,0.08)',
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12,
    alignItems: 'center', flex: 1,
  }}>
    <Text style={{ color: accent ? CELESTE : 'rgba(255,255,255,0.9)', fontSize: 20, fontWeight: '900', fontStyle: 'italic', lineHeight: 22 }}>
      {value}
    </Text>
    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 3 }}>
      {label}
    </Text>
  </View>
);

// ── Componente acción horizontal ──────────────────────────────────────
const ActionBtn = ({ icon: Icon, label, sub, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      backgroundColor: NAVY_MID, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
      borderRadius: 24, padding: 20, flex: 1, gap: 12,
    }}
  >
    <View style={{
      width: 44, height: 44, borderRadius: 14,
      backgroundColor: `${CELESTE}15`, borderWidth: 1, borderColor: `${CELESTE}33`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={22} color={CELESTE} />
    </View>
    <View>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '700', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{sub}</Text>
    </View>
  </TouchableOpacity>
);

// ══════════════════════════════════════════════════════════════════════
export default function DashboardArgentina({
  user, banners, promoBanners, activeRedemption, settings, nextTier,
  loading, setLoading, errorStatus, refreshing, onRefresh, loadProfile,
  theme, router, isScreenFocused, currentPopup, showPopupModal, setShowPopupModal,
  resolveImageUrl, showGuide, setShowGuide, showBenefits, setShowBenefits,
  fetchVipBenefits, vipBenefits, vipBenefitsLoading, redeemingVipId, handleRedeemVipBenefit
}: DashboardProps) {
  const { theme, isHappyHour } = useTheme();
  const { width: SW } = useWindowDimensions();

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading || (!user && !errorStatus)) {
    return (
      <View style={{ flex: 1, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={CELESTE} />
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginTop: 16 }}>
          Cargando Concentración
        </Text>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (errorStatus === 'connection') {
    return (
      <View style={{ flex: 1, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 40, marginBottom: 20 }}>📡</Text>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 8 }}>Sin Señal</Text>
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 40, lineHeight: 16 }}>
          No pudimos conectar con Boston. Revisá tu WiFi o datos.
        </Text>
        <TouchableOpacity onPress={() => { setLoading(true); loadProfile(); }}
          style={{ backgroundColor: CELESTE, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20 }}>
          <Text style={{ color: '#000', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => { await logout(); router.replace('/login'); }} style={{ marginTop: 24 }}>
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 }}>Cambiar de cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) return null;

  const progress = nextTier?.currentProgress ?? 100;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>
      <StatusBar style="light" />

      {/* Glow background */}
      <View style={{ position: 'absolute', top: -100, right: -80, width: 340, height: 340, borderRadius: 999, backgroundColor: CELESTE, opacity: 0.07 }} />
      <View style={{ position: 'absolute', bottom: 100, left: -80, width: 260, height: 260, borderRadius: 999, backgroundColor: GOLD, opacity: 0.04 }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CELESTE} />}
      >

        {/* ══ HERO HEADER ══════════════════════════════════════════════ */}
        <LinearGradient
          colors={[`${CELESTE}18`, 'transparent']}
          style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 32 }}
        >
          {/* Top bar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <Star size={9} color={GOLD} fill={GOLD} />
                <Star size={9} color={GOLD} fill={GOLD} />
                <Star size={9} color={GOLD} fill={GOLD} />
              </View>
              <Text style={{ color: '#fff', fontSize: 38, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1.5, lineHeight: 38 }}>
                ¡Hola{' '}
                <Text style={{ color: CELESTE }}>Muchachos!</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <UserIcon size={18} color={CELESTE} />
            </TouchableOpacity>
          </View>

          {/* Happy Hour Banner */}
          {isHappyHour && (
            <FadeInView delay={300} style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ backgroundColor: GOLD, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, shadowColor: GOLD, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 15, borderWidth: 1, borderColor: '#FFF' }}>
                <Text style={{ color: 'black', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>¡TIEMPO DE DESCUENTO! Puntos x2</Text>
              </View>
            </FadeInView>
          )}

          {/* Player card row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 20 }}>
            {/* Argentine flag bubble */}
            <View style={{
              width: 90, height: 90, borderRadius: 28,
              backgroundColor: `${CELESTE}15`, borderWidth: 2, borderColor: `${CELESTE}33`,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: CELESTE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20,
            }}>
              <Text style={{ fontSize: 44 }}>🇦🇷</Text>
            </View>

            {/* Name & rank */}
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
                Capitán
              </Text>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1, lineHeight: 32 }}>
                {user.firstName}
              </Text>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5, opacity: 0.5 }}>
                {user.lastName || ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                <View style={{
                  backgroundColor: `${CELESTE}22`, borderWidth: 1, borderColor: `${CELESTE}44`,
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                }}>
                  <Text style={{ color: CELESTE, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
                    {user.membershipLevel}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ══ ACTIVE REDEMPTION (Ticket de partido) ════════════════════ */}
        {activeRedemption && (
          <FadeInView style={{ paddingHorizontal: 24, marginTop: -8, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/reward-qr', params: { token: activeRedemption.qrToken, reward: activeRedemption.title } })}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[CELESTE, '#4A87C2']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}
              >
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 }}>
                    🎟 Entrada Lista para Canjear
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5 }} numberOfLines={1}>
                    {activeRedemption.title}
                  </Text>
                </View>
                <ArrowRight size={20} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* ══ STATS ROW (ficha de jugador) ═════════════════════════════ */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatPill label="Gloria" value={user.points.toLocaleString()} accent />
            <StatPill label="Racha" value={`${user.streak || 0}🔥`} />
            <StatPill label="Nivel" value={user.membershipLevel?.slice(0, 3)} />
          </View>

          {/* Progress bar estilo marcador */}
          <TouchableOpacity
            onPress={() => { setShowBenefits(true); fetchVipBenefits(); }}
            activeOpacity={0.9}
            style={{
              marginTop: 12, backgroundColor: NAVY_MID,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
              borderRadius: 20, padding: 18,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
                Camino a {nextTier?.name || 'Cima'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: CELESTE, fontSize: 11, fontWeight: '900' }}>
                  {Math.round(progress)}%
                </Text>
                <ChevronRight size={14} color={CELESTE} />
              </View>
            </View>

            {/* Stadium-style progress bar */}
            <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <LinearGradient
                colors={[CELESTE, '#4A87C2']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: '100%', width: `${progress}%`, borderRadius: 3 }}
              />
            </View>

            {/* Stars below progress */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              {[1, 2, 3, 4].map(i => (
                <Star
                  key={i} size={12}
                  color={progress > i * 25 ? GOLD : 'rgba(255,255,255,0.1)'}
                  fill={progress > i * 25 ? GOLD : 'transparent'}
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* ══ NEWS BANNERS (horizontal scroll tipo transmisión) ════════ */}
        {banners.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -0.5 }}>
                Últimas Noticias
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>En Vivo</Text>
              </View>
            </View>
            <FlatList
              data={banners.slice(0, 5)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, gap: 14 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
                  activeOpacity={0.9}
                  style={{ width: SW * 0.62, borderRadius: 24, overflow: 'hidden', backgroundColor: NAVY_MID }}
                >
                  {item.mediaType === 'VIDEO' && item.videoUrl ? (
                    isScreenFocused ? (
                      <VideoPlayer uri={resolveImageUrl(item.videoUrl) || ''} style={{ width: '100%', height: 200 }} />
                    ) : (
                      <Image source={{ uri: resolveImageUrl(item.imageUrl) || '' }} style={{ width: '100%', height: 200, opacity: 0.8 }} resizeMode="cover" />
                    )
                  ) : (
                    <Image
                      source={{ uri: resolveImageUrl(item.imageUrl) || '' }}
                      style={{ width: '100%', height: 200 }}
                      resizeMode="cover"
                    />
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(2,11,26,0.95)']}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', padding: 16, justifyContent: 'flex-end' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.3, lineHeight: 16, marginBottom: 8 }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: `${CELESTE}22`, borderWidth: 1, borderColor: `${CELESTE}44`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ color: CELESTE, fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Ver nota</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ══ ACCIONES (estilo vestuario) ═══════════════════════════════ */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' }}>
              Vestuario
            </Text>
            <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ActionBtn icon={Trophy} label="Trofeos" sub="Tus premios" onPress={() => router.push('/rewards')} />
            <ActionBtn icon={MapPin} label="Estadio" sub="Partidos" onPress={() => router.push('/events')} />
            <ActionBtn icon={ClipboardList} label="Planilla" sub="Tu juego" onPress={() => router.push('/history')} />
          </View>
        </View>

        {/* ══ BANNER ALCANZAR GLORIA (Club Info) ══════════════════════ */}
        <FadeInView style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <TouchableOpacity onPress={() => router.push('/club-info')} activeOpacity={0.85}>
            <LinearGradient
              colors={[`${CELESTE}14`, NAVY_MID]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24, borderWidth: 1, borderColor: `${CELESTE}22`,
                padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
              }}
            >
              <View style={{
                width: 52, height: 52, borderRadius: 16,
                backgroundColor: `${CELESTE}15`, borderWidth: 1, borderColor: `${CELESTE}33`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={26} color={CELESTE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -0.3 }}>
                  ¿Cómo alcanzar la Gloria?
                </Text>
                <Text style={{ color: CELESTE, fontWeight: '700', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>
                  Aprende a sumar puntos y ser Leyenda
                </Text>
              </View>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: CELESTE, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={16} color="#000" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </FadeInView>

        {/* ══ PROMOS (horizontal, estilo tablón del vestuario) ═════════ */}
        {promoBanners.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -0.5 }}>
                Promos de Selección
              </Text>
            </View>
            <FlatList
              data={promoBanners}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, gap: 14 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
                  activeOpacity={0.9}
                  style={{ width: SW * 0.78, height: 130, backgroundColor: NAVY_MID, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 22, overflow: 'hidden', flexDirection: 'row' }}
                  key={item.id}
                >
                  <View style={{ flex: 1, padding: 18, justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.3, lineHeight: 17, marginBottom: 8 }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={{ backgroundColor: `${CELESTE}22`, borderWidth: 1, borderColor: `${CELESTE}33`, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: CELESTE, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Ver Promo</Text>
                    </View>
                  </View>
                  <View style={{ width: 120, position: 'relative' }}>
                    {item.mediaType === 'VIDEO' && item.videoUrl ? (
                      isScreenFocused ? (
                        <VideoPlayer uri={resolveImageUrl(item.videoUrl) || ''} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Image source={{ uri: resolveImageUrl(item.imageUrl) || '' }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                      )
                    ) : (
                      <Image
                        source={{ uri: resolveImageUrl(item.imageUrl) || '' }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    )}
                    <LinearGradient
                      colors={[NAVY_MID, 'transparent']}
                      start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

      </ScrollView>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <VipStatusModal isVisible={showBenefits} onClose={() => setShowBenefits(false)} user={user} settings={settings} onRedeemSuccess={handleRedeemVipBenefit} />

      <Modal visible={showPopupModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: NAVY_MID, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <TouchableOpacity onPress={() => setShowPopupModal(false)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 50, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
            {currentPopup?.mediaType === 'VIDEO' ? (
              <View style={{ width: '100%', height: 460 }}>
                <VideoPlayer uri={resolveImageUrl(currentPopup.videoUrl) || ''} />
              </View>
            ) : (
              <Image source={{ uri: resolveImageUrl(currentPopup?.imageUrl) || '' }} style={{ width: '100%', height: 460 }} resizeMode="cover" />
            )}
            <LinearGradient colors={['transparent', NAVY_MID]} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, padding: 28, justifyContent: 'flex-end' }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5, textAlign: 'center', marginBottom: 8 }}>{currentPopup?.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 12, fontWeight: '600', marginBottom: 20, paddingHorizontal: 16 }}>{currentPopup?.description}</Text>
              <TouchableOpacity
                onPress={() => { setShowPopupModal(false); if (currentPopup?.id) router.push(`/banner/${currentPopup.id}`); }}
                style={{ backgroundColor: CELESTE, borderRadius: 18, paddingVertical: 18 }}
              >
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' }}>
                  {currentPopup?.benefits || 'IR A LA CANCHA →'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}
