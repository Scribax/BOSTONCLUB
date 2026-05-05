import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { ArrowLeft, CheckCircle2, XCircle, Star, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScannerProps } from './types';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const CELESTE = '#75AADB';
const GOLD    = '#F0C040';
const NAVY    = '#020B1A';

export default function ScannerArgentina(props: ScannerProps) {
  const router = useRouter();
  const { isHappyHour } = useTheme();
  const { permission, requestPermission, status, message, scanned, handleBarcodeScanned, resetScanner, theme } = props;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 56, marginBottom: 24 }}>🇦🇷</Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
          Acceso al Estadio
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, lineHeight: 18, marginBottom: 40 }}>
          Necesitamos activar tu cámara para escanear y validar tu entrada al estadio Boston.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: CELESTE, paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic' }}>
            Activar Cámara
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>
      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20, backgroundColor: `${NAVY}E6` }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={20} color={CELESTE} />
          </TouchableOpacity>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <Star size={7} color={GOLD} fill={GOLD} />
              <Star size={7} color={GOLD} fill={GOLD} />
              <Star size={7} color={GOLD} fill={GOLD} />
            </View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5 }}>
              Control de Acceso
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 28 }}>🏟️</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', position: 'relative' }}>

        {/* IDLE – Camera active */}
        {status === 'idle' && (
          <View style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 0 }}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={{ flex: 1, backgroundColor: 'rgba(2,11,26,0.55)', justifyContent: 'center', alignItems: 'center' }}>
              {/* Scan frame */}
              <View style={{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                {/* Corner markers - Argentina blue */}
                {[[-1,-1,'borderTopWidth','borderLeftWidth'],[-1,1,'borderTopWidth','borderRightWidth'],[1,-1,'borderBottomWidth','borderLeftWidth'],[1,1,'borderBottomWidth','borderRightWidth']].map(([r,c,b1,b2], i) => (
                  <View key={i} style={{
                    position: 'absolute',
                    top: r === -1 ? -4 : undefined, bottom: r === 1 ? -4 : undefined,
                    left: c === -1 ? -4 : undefined, right: c === 1 ? -4 : undefined,
                    width: 36, height: 36,
                    [b1 as string]: 4, [b2 as string]: 4,
                    borderColor: CELESTE,
                    borderRadius: 4,
                  }} />
                ))}
                <Star size={20} color={CELESTE} fill={CELESTE} style={{ opacity: 0.5 }} />
              </View>

              <View style={{ backgroundColor: isHappyHour ? `${GOLD}1A` : 'rgba(2,11,26,0.85)', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: isHappyHour ? GOLD : `${CELESTE}33`, marginBottom: 24 }}>
                <Text style={{ color: isHappyHour ? GOLD : CELESTE, fontWeight: '900', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center' }}>
                  {isHappyHour ? '¡GLORIA MULTIPLICADA x2!' : 'Apuntá al código'}
                </Text>
              </View>

              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', paddingHorizontal: 48 }}>
                {isHappyHour ? 'TODOS TUS CONSUMOS Y CHECK-INS SUMAN EL DOBLE' : 'Escaneá el QR en la entrada del estadio para sumar tu gloria'}
              </Text>
            </View>
          </View>
        )}

        {/* LOADING */}
        {status === 'loading' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: NAVY }}>
            <ActivityIndicator size="large" color={CELESTE} style={{ marginBottom: 24 }} />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 3, fontStyle: 'italic' }}>
              Verificando entrada...
            </Text>
          </View>
        )}

        {/* POS WAITING */}
        {status === 'pos_waiting' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: NAVY }}>
            <Text style={{ fontSize: 56, marginBottom: 24 }}>⏳</Text>
            <Text style={{ color: CELESTE, fontSize: 22, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
              Procesando Pago
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 48 }}>
              Esperando confirmación del punto de venta. Mantené la conexión abierta.
            </Text>
            <TouchableOpacity
              onPress={resetScanner}
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: '100%' }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: NAVY }}>
            <LinearGradient
              colors={[CELESTE, '#4A87C2']}
              style={{ width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowColor: CELESTE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24 }}
            >
              <CheckCircle2 size={52} color="#000" />
            </LinearGradient>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1, textAlign: 'center', marginBottom: 8 }}>
              ¡Goool de Gloria!
            </Text>
            <Text style={{ color: GOLD, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center', marginBottom: 12 }}>
              ★ ★ ★
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 48 }}>
              {message}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              style={{ width: '100%', borderRadius: 20, overflow: 'hidden' }}
            >
              <LinearGradient colors={[CELESTE, '#4A87C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic' }}>
                  Volver al Estadio
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: NAVY }}>
            <XCircle size={64} color="#EF4444" style={{ marginBottom: 24 }} />
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
              Acceso Denegado
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 48 }}>
              {message}
            </Text>
            <TouchableOpacity
              onPress={resetScanner}
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: '100%' }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' }}>
                Intentar de Nuevo
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </View>
  );
}
