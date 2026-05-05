import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Users, Zap, Star, ChevronRight, Target } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClubInfoProps } from './types';

const CELESTE = '#75AADB';
const GOLD    = '#F0C040';
const NAVY    = '#020B1A';

const MissionCard = ({ icon: Icon, color, title, description, reward, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={{
      backgroundColor: '#060D18', borderRadius: 24,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
      padding: 20, flexDirection: 'row', alignItems: 'center',
      marginBottom: 12,
    }}
  >
    <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: `${color}14`, borderWidth: 1, borderColor: `${color}22` }}>
      <Icon size={26} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.3, lineHeight: 18 }}>{title}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{description}</Text>
    </View>
    {reward && (
      <View style={{ backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}33`, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, marginRight: 10 }}>
        <Text style={{ color, fontSize: 13, fontWeight: '900', fontStyle: 'italic' }}>+{reward}</Text>
      </View>
    )}
    <ChevronRight size={18} color="rgba(255,255,255,0.15)" />
  </TouchableOpacity>
);

export default function ClubInfoArgentina(props: ClubInfoProps) {
  const router = useRouter();
  const { user, theme, isEnabled, pointsRate, referralPoints, streak, multiplier, progressWidth } = props;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* HERO */}
        <View style={{ position: 'relative' }}>
          <LinearGradient
            colors={[`${CELESTE}22`, `${CELESTE}08`, NAVY]}
            style={{ paddingTop: 56, paddingBottom: 80, paddingHorizontal: 24 }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ position: 'absolute', top: 56, left: 24, zIndex: 20, width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft color={CELESTE} size={22} />
            </TouchableOpacity>

            {/* Rank badge top-right */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-end', marginBottom: 32, backgroundColor: `${CELESTE}14`, borderWidth: 1, borderColor: `${CELESTE}33`, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ fontSize: 16 }}>🇦🇷</Text>
              <Text style={{ color: CELESTE, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
                {user?.membershipLevel || 'AMATEUR'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Star size={10} color={GOLD} fill={GOLD} />
              <Star size={10} color={GOLD} fill={GOLD} />
              <Star size={10} color={GOLD} fill={GOLD} />
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginLeft: 8 }}>
                Guía del Jugador
              </Text>
            </View>

            <Text style={{ color: '#fff', fontSize: 46, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 44 }}>
              CAMINO A{'\n'}LA GLORIA
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 16, maxWidth: '85%', lineHeight: 22, fontStyle: 'italic' }}>
              Cada peso que gastás en Boston suma puntos y te acerca a los trofeos más grandes.
            </Text>
          </LinearGradient>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: `${CELESTE}1A` }} />
        </View>

        {/* RACHA CARD */}
        <View style={{ paddingHorizontal: 24, marginTop: -24, marginBottom: 28, zIndex: 10 }}>
          <View style={{ backgroundColor: '#060D18', borderRadius: 28, padding: 24, borderWidth: 1.5, borderColor: `${CELESTE}33`, shadowColor: CELESTE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Zap size={14} color={GOLD} fill={GOLD} />
                  <Text style={{ color: GOLD, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2.5 }}>Racha de Partidos</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 48, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2, lineHeight: 48 }}>×{multiplier}</Text>
              </View>
              <View style={{ backgroundColor: `${CELESTE}14`, borderWidth: 1, borderColor: `${CELESTE}33`, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: CELESTE, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, fontStyle: 'italic' }}>
                  {streak} {streak === 1 ? 'visita' : 'visitas'} 🔥
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 20, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <LinearGradient colors={[CELESTE, GOLD]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ height: '100%', width: progressWidth as any, borderRadius: 3 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.1)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Suplente</Text>
              <Text style={{ color: 'rgba(255,255,255,0.1)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Titular</Text>
              <Text style={{ color: 'rgba(255,255,255,0.1)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Leyenda</Text>
            </View>
          </View>
        </View>

        {/* CONVERSION CARD */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View style={{ backgroundColor: '#060D18', borderRadius: 28, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' }}>$</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', fontStyle: 'italic' }}>$1</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Zap size={28} color={CELESTE} fill={CELESTE} />
                <Text style={{ color: CELESTE, fontSize: 7, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginTop: 6 }}>SUMA</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, backgroundColor: `${CELESTE}14`, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${CELESTE}33`, marginBottom: 8 }}>
                  <Trophy size={26} color={CELESTE} />
                </View>
                <Text style={{ color: CELESTE, fontSize: 36, fontWeight: '900', fontStyle: 'italic' }}>{pointsRate}</Text>
              </View>
            </View>

            <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', lineHeight: 16 }}>
                1 peso = {pointsRate} pts de gloria • Acumula al instante
              </Text>
            </View>
          </View>
        </View>

        {/* MISSIONS */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingHorizontal: 4 }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, fontStyle: 'italic' }}>
              Tácticas de Juego
            </Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={{ color: CELESTE, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Ver actividad →</Text>
            </TouchableOpacity>
          </View>

          {isEnabled('enable_referrals') && (
            <MissionCard
              icon={Users} color="#3B82F6"
              title="Traer Refuerzos"
              description="Invitá a un amigo al club"
              reward={`${referralPoints}`}
              onPress={() => router.push('/(tabs)/profile')}
            />
          )}
          <MissionCard
            icon={Target} color={CELESTE}
            title="Fichar en el Estadio"
            description="Escaneá el QR al llegar"
            onPress={() => router.push('/(tabs)/scanner')}
          />
          <MissionCard
            icon={Zap} color={GOLD}
            title="Consumir en el POSNET"
            description="Usá el QR en la barra"
            onPress={() => router.push('/(tabs)/scanner')}
          />
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 60 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.9} style={{ borderRadius: 24, overflow: 'hidden' }}>
            <LinearGradient
              colors={[CELESTE, '#4A87C2']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 24, alignItems: 'center' }}
            >
              <Text style={{ color: '#000', fontSize: 18, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5 }}>
                🇦🇷  ¡A LA CANCHA!
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
