import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  Mail, Lock, Trophy, ArrowRight, Shirt, Star,
  Eye, EyeOff, Phone, User, Calendar, Hash, Ticket,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../../components/VideoPlayer';
import { LoginProps } from './types';
import { LinearGradient } from 'expo-linear-gradient';

// ------------------------------------------------------------------
// Reusable Field Row
// ------------------------------------------------------------------
const Field = ({
  label, icon: Icon, color, children,
}: { label: string; icon: any; color: string; children: React.ReactNode }) => (
  <View style={{ gap: 6 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon size={11} color={color} />
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
    {children}
  </View>
);

const inputBase: object = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: '#fff',
  fontSize: 13,
  fontWeight: '700',
};

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function LoginArgentina(props: LoginProps) {
  const {
    isLogin, setIsLogin,
    email, setEmail, password, setPassword,
    firstName, setFirstName, lastName, setLastName,
    dni, setDni, whatsapp, setWhatsapp,
    birthDateInput, setBirthDateInput,
    referralCode, setReferralCode,
    loading, showPassword, setShowPassword,
    videoUrl, theme, handleAuth, resolveVideoUrl,
  } = props;

  const accentBlue = theme.primary;   // #75AADB
  const accentGold = '#F0C040';        // Oro del Mundial
  const cardBg     = 'rgba(2,6,23,0.82)';

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar style="light" />

      {/* ── Background ── */}
      {videoUrl ? (
        <VideoPlayer uri={resolveVideoUrl(videoUrl) || ''} style={StyleSheet.absoluteFillObject} />
      ) : null}

      {/* Diagonal stripe overlay – celeste & blanco */}
      <LinearGradient
        colors={['rgba(117,170,219,0.18)', 'transparent', 'rgba(255,255,255,0.06)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(2,6,23,0.72)' }]} />

      {/* ── Content ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 56 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── HEADER ── */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            {/* 3-star badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 6 }}>
              <Star size={12} color={accentGold} fill={accentGold} />
              <Star size={18} color={accentGold} fill={accentGold} />
              <Star size={12} color={accentGold} fill={accentGold} />
            </View>

            {/* Trophy icon */}
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: 'rgba(117,170,219,0.12)',
              borderWidth: 1.5, borderColor: `${accentBlue}55`,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 18,
              shadowColor: accentBlue, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6, shadowRadius: 20,
            }}>
              <Trophy size={36} color={accentBlue} />
            </View>

            <Text style={{
              color: '#fff', fontSize: 36, fontWeight: '900',
              fontStyle: 'italic', textTransform: 'uppercase',
              letterSpacing: -1, textAlign: 'center', lineHeight: 36,
            }}>
              {isLogin ? 'Ingresa\nal Estadio' : 'Únete al\nEquipo'}
            </Text>
            <View style={{ width: 48, height: 3, backgroundColor: accentBlue, borderRadius: 2, marginTop: 12 }} />
          </View>

          {/* ── FORM CARD ── */}
          <View style={{
            backgroundColor: cardBg,
            borderWidth: 1.5, borderColor: 'rgba(117,170,219,0.18)',
            borderRadius: 40, overflow: 'hidden',
            paddingHorizontal: 28, paddingVertical: 32,
          }}>

            {/* Celeste top-stripe */}
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              backgroundColor: accentBlue, opacity: 0.7,
            }} />

            <View style={{ gap: 20 }}>

              {/* ── REGISTER-ONLY FIELDS ── */}
              {!isLogin && (
                <>
                  {/* Row: Nombre / Apellido */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <User size={10} color="rgba(255,255,255,0.4)" />
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Nombre</Text>
                      </View>
                      <TextInput
                        value={firstName} onChangeText={setFirstName} placeholder="MARTÍN"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        style={inputBase}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <User size={10} color="rgba(255,255,255,0.4)" />
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Apellido</Text>
                      </View>
                      <TextInput
                        value={lastName} onChangeText={setLastName} placeholder="PALERMO"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        style={inputBase}
                      />
                    </View>
                  </View>

                  {/* DNI */}
                  <Field label="DNI del Jugador" icon={Hash} color="rgba(255,255,255,0.4)">
                    <TextInput
                      value={dni}
                      onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))}
                      placeholder="12345678" keyboardType="numeric"
                      placeholderTextColor="rgba(255,255,255,0.15)"
                      style={inputBase}
                    />
                  </Field>

                  {/* Row: WhatsApp / Nacimiento */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1.2, gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Phone size={10} color="rgba(255,255,255,0.4)" />
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>WhatsApp</Text>
                      </View>
                      <TextInput
                        value={whatsapp}
                        onChangeText={(t) => setWhatsapp(t.replace(/\D/g, ''))}
                        placeholder="11 2233 4455" keyboardType="numeric"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        style={inputBase}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Calendar size={10} color="rgba(255,255,255,0.4)" />
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Nacimiento</Text>
                      </View>
                      <TextInput
                        value={birthDateInput}
                        onChangeText={(t) => {
                          let c = t.replace(/\D/g, '');
                          if (c.length > 8) c = c.slice(0, 8);
                          let f = c;
                          if (c.length > 4) f = `${c.slice(0, 2)}/${c.slice(2, 4)}/${c.slice(4)}`;
                          else if (c.length > 2) f = `${c.slice(0, 2)}/${c.slice(2)}`;
                          setBirthDateInput(f);
                        }}
                        placeholder="DD/MM/AAAA" keyboardType="numeric"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        style={inputBase}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* ── EMAIL ── */}
              <Field label="Correo del Jugador" icon={Mail} color="rgba(255,255,255,0.4)">
                <View style={{ flexDirection: 'row', alignItems: 'center', ...(inputBase as object), paddingVertical: 0, height: 50 }}>
                  <Mail size={16} color={accentBlue} style={{ marginRight: 10 }} />
                  <TextInput
                    value={email} onChangeText={setEmail}
                    placeholder="email@ejemplo.com"
                    autoCapitalize="none" keyboardType="email-address"
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    style={{ flex: 1, color: '#fff', fontWeight: '700', fontSize: 13 }}
                  />
                </View>
              </Field>

              {/* ── PASSWORD ── */}
              <Field label="Contraseña" icon={Lock} color="rgba(255,255,255,0.4)">
                <View style={{ flexDirection: 'row', alignItems: 'center', ...(inputBase as object), paddingVertical: 0, height: 50 }}>
                  <Lock size={16} color={accentBlue} style={{ marginRight: 10 }} />
                  <TextInput
                    value={password} onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    style={{ flex: 1, color: '#fff', fontWeight: '700', fontSize: 13 }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <EyeOff size={18} color="rgba(255,255,255,0.3)" />
                      : <Eye size={18} color="rgba(255,255,255,0.3)" />}
                  </TouchableOpacity>
                </View>
              </Field>

              {/* ── REFERRAL CODE (register only) ── */}
              {!isLogin && (
                <Field label="Código de Referido (Opcional)" icon={Ticket} color={accentGold}>
                  <TextInput
                    value={referralCode} onChangeText={setReferralCode}
                    placeholder="ABC-123"
                    autoCapitalize="characters"
                    placeholderTextColor={`${accentGold}44`}
                    style={{
                      ...(inputBase as object),
                      backgroundColor: `${accentGold}0D`,
                      borderColor: `${accentGold}33`,
                      color: accentGold,
                      letterSpacing: 4,
                    }}
                  />
                </Field>
              )}

              {/* ── SUBMIT BUTTON ── */}
              <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.85} style={{ marginTop: 8 }}>
                <LinearGradient
                  colors={[accentBlue, '#4A87C2']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 20, height: 58,
                    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
                    shadowColor: accentBlue, shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Shirt size={18} color="#fff" style={{ marginRight: 10 }} />
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic' }}>
                        {isLogin ? 'Salir a la Cancha' : 'Fichar Jugador'}
                      </Text>
                      <ArrowRight size={18} color="#fff" style={{ marginLeft: 10 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* ── TOGGLE LOGIN/REGISTER ── */}
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {isLogin ? '¿No tienes dorsal? ' : '¿Ya eres del equipo? '}
                  <Text style={{ color: accentBlue }}>
                    {isLogin ? 'Únete a la Scaloneta' : 'Inicia Concentración'}
                  </Text>
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* ── FOOTER ── */}
          <View style={{ marginTop: 32, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <View style={{ height: 1, width: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>
              BOSTON CLUB • MUNDIAL EDITION
            </Text>
            <View style={{ height: 1, width: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
