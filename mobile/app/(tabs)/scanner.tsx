import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, ScanLine, Sparkles, CheckCircle2, AlertCircle, XCircle } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../lib/api';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      // Reiniciar el scanner automáticamente al volver a la pantalla
      setStatus("idle");
      setMessage("");
      setScanned(false);
    }, [])
  );

  if (!permission) {
    return <View className="flex-1 bg-boston-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-boston-black items-center justify-center p-10">
        <ScanLine size={60} color="#D4AF37" className="mb-6 opacity-20" />
        <Text className="text-white text-xl font-black uppercase italic text-center mb-4">Acceso a la Cámara</Text>
        <Text className="text-white/50 text-center mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
          Necesitamos tu cámara para escanear el QR del POSNET y acreditar tus puntos.
        </Text>
        <TouchableOpacity 
          onPress={requestPermission}
          className="bg-boston-gold px-10 py-5 rounded-2xl"
        >
          <Text className="text-black font-black uppercase text-xs italic">Permitir Acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || status !== 'idle') return;
    setScanned(true);
    setStatus('loading');

    try {
      // 1. Detectar si es un QR de Mercado Pago (POSNET)
      const mpRegex = /(?:mercadopago\.com(?:\.ar)?|mpago\.la)\/(?:s|p|order|instore)\/([a-zA-Z0-9_-]+)/;
      const match = data.match(mpRegex);

      if (match) {
        const orderId = match[1];
        setMessage("Vinculando pago con tu cuenta...");
        
        await api.post('/payments/track-pos', { orderId });

        setStatus("success");
        setMessage("¡Vinculado con éxito! Redirigiendo a Mercado Pago para completar el pago...");
        
        setTimeout(() => {
          Linking.openURL(data).catch(() => {
            setStatus("error");
            setMessage("No se pudo abrir la aplicación de Mercado Pago.");
          });
        }, 2000);
        return;
      }

      // 2. Procesar como un QR de puntos normal
      const response = await api.post('/promo/claim', { token: data });
      setStatus("success");
      setMessage(response.data.message || "Puntos acreditados con éxito.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Error al procesar el código. Intenta nuevamente.");
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setStatus('idle');
    setMessage('');
  };

  return (
    <View className="flex-1 bg-[#050505]">
      {/* Header Modal Style */}
      <View className="pt-16 pb-4 px-6 flex-row items-center border-b border-white/5 bg-black/50 z-20">
        <TouchableOpacity onPress={() => router.push('/(tabs)')} className="p-3 bg-white/5 rounded-full mr-4">
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black uppercase tracking-tight text-white italic">Escanear QR</Text>
      </View>

      <View className="flex-1 justify-center relative">
        {status === 'idle' && (
          <View className="flex-1 absolute inset-0 z-0">
             <CameraView 
               style={StyleSheet.absoluteFillObject}
               onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
               barcodeScannerSettings={{
                 barcodeTypes: ["qr"],
               }}
             />
             {/* Overlay UI when Camera is active */}
             <View className="flex-1 bg-black/40 justify-center items-center">
                <View className="w-64 h-64 border-[3px] border-boston-gold/50 rounded-[40px] border-dashed items-center justify-center bg-black/10">
                   <View className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-boston-gold rounded-tl-[20px]" />
                   <View className="absolute -top-4 -right-4 w-8 h-8 border-t-4 border-r-4 border-boston-gold rounded-tr-[20px]" />
                   <View className="absolute -bottom-4 -left-4 w-8 h-8 border-b-4 border-l-4 border-boston-gold rounded-bl-[20px]" />
                   <View className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-boston-gold rounded-br-[20px]" />
                </View>
                <View className="bg-black/60 px-6 py-3 rounded-full mt-10 border border-white/10">
                  <Text className="text-boston-gold font-bold uppercase text-[10px] tracking-widest text-center">Enfoque el código QR</Text>
                </View>
                <Text className="text-white/80 text-[11px] text-center mt-6 uppercase font-black tracking-[0.2em] px-10 leading-5">
                   CENTRO DE ESCANEO UNIVERSAL
                </Text>
                <Text className="text-white/40 text-[9px] text-center mt-2 uppercase tracking-[0.1em] px-12 leading-4">
                   Apunta aquí para realizar pagos, hacer tu Check-in o sumar puntos con los códigos del Club.
                </Text>
             </View>
          </View>
        )}

        {status === 'loading' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
             <ActivityIndicator size="large" color="#D4AF37" className="mb-6 scale-150" />
             <Text className="text-sm font-bold uppercase tracking-widest text-white animate-pulse">Validando código...</Text>
          </View>
        )}

        {status === 'success' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
            <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-8 shadow-lg">
              <CheckCircle2 size={40} color="white" />
            </View>
            <Text className="text-2xl font-black mb-4 uppercase italic text-white text-center">¡Procesado!</Text>
            <Text className="text-white/60 text-sm mb-10 text-center font-medium leading-relaxed px-6">
              {message}
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)')}
              className="bg-white px-8 py-4 rounded-2xl w-full"
            >
              <Text className="text-black font-black text-xs uppercase tracking-widest text-center">Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
            <View className="w-20 h-20 bg-boston-red rounded-full items-center justify-center mb-8 shadow-lg">
              <XCircle size={40} color="white" />
            </View>
            <Text className="text-2xl font-black mb-4 uppercase italic text-boston-red-glow text-center">Aviso</Text>
            <Text className="text-white/60 text-sm mb-10 text-center font-medium leading-relaxed px-6">
              {message}
            </Text>
            <TouchableOpacity 
              onPress={resetScanner}
              className="bg-white/10 px-8 py-4 rounded-2xl w-full border border-white/5"
            >
              <Text className="text-white font-black text-xs uppercase tracking-widest text-center">Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
