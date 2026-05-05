import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Star, CheckCircle2, ArrowRight } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { StatusBar } from 'expo-status-bar';
import { RewardQRProps } from './types';

const CELESTE = '#75AADB';
const GOLD    = '#F0C040';
const NAVY    = '#020B1A';

export default function RewardQRArgentina(props: RewardQRProps) {
  const router = useRouter();
  const { token, reward, isCompleted, timeLeft, totpTimestamp, cancelling, handleCancel, theme, fadeAnim } = props;

  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>
      <StatusBar style="light" />
      {/* Glow */}
      <View style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: 999, backgroundColor: CELESTE, opacity: 0.08 }} />

      {/* Back */}
      <View style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 8, zIndex: 10 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color={CELESTE} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ paddingHorizontal: 24 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 }}>
          <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>

            {/* Ticket card */}
            <View style={{
              backgroundColor: '#060D18', borderWidth: 1.5,
              borderColor: isCompleted ? '#22c55e33' : `${CELESTE}33`,
              borderRadius: 40, padding: 32, alignItems: 'center',
              position: 'relative', overflow: 'hidden',
              shadowColor: CELESTE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 24,
            }}>
              {/* Perforation circles */}
              <View style={{ position: 'absolute', left: -20, top: '45%', width: 40, height: 40, borderRadius: 20, backgroundColor: NAVY, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
              <View style={{ position: 'absolute', right: -20, top: '45%', width: 40, height: 40, borderRadius: 20, backgroundColor: NAVY, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }} />

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 28 }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 18,
                  backgroundColor: isCompleted ? 'rgba(34,197,94,0.1)' : `${CELESTE}14`,
                  borderWidth: 1, borderColor: isCompleted ? '#22c55e44' : `${CELESTE}33`,
                  alignItems: 'center', justifyContent: 'center', marginRight: 16,
                }}>
                  {isCompleted ? <CheckCircle2 size={28} color="#22c55e" /> : <Trophy size={28} color={CELESTE} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isCompleted ? '#22c55e' : CELESTE, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 4 }}>
                    {isCompleted ? '✓ Trofeo Entregado' : '🏆 Entrada de Trofeo'}
                  </Text>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 22 }} numberOfLines={2}>
                    {reward}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 28, borderStyle: 'dashed' }} />

              {isCompleted ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ fontSize: 56, marginBottom: 16 }}>🇦🇷</Text>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 28, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1, textAlign: 'center', marginBottom: 8 }}>
                    ¡Es un Golazo!
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                    <Star size={14} color={GOLD} fill={GOLD} />
                    <Star size={14} color={GOLD} fill={GOLD} />
                    <Star size={14} color={GOLD} fill={GOLD} />
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5, lineHeight: 18 }}>
                    Tu trofeo fue entregado con éxito.{'\n'}Disfrutalo, campeón.
                  </Text>
                </View>
              ) : (
                <>
                  {/* QR */}
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 2, borderColor: `${CELESTE}66` }}>
                    <QRCode value={`${token}|${totpTimestamp}`} size={200} color="#000" backgroundColor="transparent" />
                  </View>

                  {/* Timer */}
                  <View style={{ width: '100%', marginBottom: 24 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 10 }}>
                      Renovando en <Text style={{ color: CELESTE }}>{timeLeft}s</Text>
                    </Text>
                    <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <LinearGradient
                        colors={[CELESTE, '#4A87C2']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ height: '100%', width: `${(timeLeft / 30) * 100}%`, borderRadius: 2 }}
                      />
                    </View>
                  </View>

                  <Text style={{ color: CELESTE, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8, textAlign: 'center' }}>
                    🔒 Código Seguro
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '600', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 16 }}>
                    El código cambia cada 30s.{'\n'}Las capturas de pantalla no funcionan.
                  </Text>
                </>
              )}
            </View>

            {/* Back to stadium */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.replace('/(tabs)')}
              style={{ marginTop: 24, borderRadius: 20, overflow: 'hidden' }}
            >
              <LinearGradient colors={[CELESTE, '#4A87C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic' }}>
                  Volver al Estadio
                </Text>
                <ArrowRight size={18} color="#000" />
              </LinearGradient>
            </TouchableOpacity>

            {!isCompleted && (
              <TouchableOpacity activeOpacity={0.8} onPress={handleCancel} disabled={cancelling} style={{ marginTop: 16, alignItems: 'center', paddingVertical: 12 }}>
                {cancelling
                  ? <ActivityIndicator size="small" color={CELESTE} />
                  : <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>Cancelar Canje</Text>
                }
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
