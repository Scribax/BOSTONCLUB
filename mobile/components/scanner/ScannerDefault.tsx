import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, ScrollView } from 'react-native';
import { CameraView } from 'expo-camera';
import { ArrowLeft, ScanLine, CheckCircle2, XCircle, HelpCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScannerProps } from './types';

export default function ScannerDefault(props: ScannerProps) {
  const router = useRouter();
  const { permission, requestPermission, status, message, scanned, handleBarcodeScanned, resetScanner, showTutorial, setShowTutorial, theme } = props;

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-boston-black items-center justify-center p-10">
        <ScanLine size={60} color="#D4AF37" className="mb-6 opacity-20" />
        <Text className="text-white text-xl font-black uppercase italic text-center mb-4">Acceso a la Cámara</Text>
        <Text className="text-white/50 text-center mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
          Necesitamos tu cámara para escanear el QR del POSNET y acreditar tus puntos.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: theme.secondary }} className="px-10 py-5 rounded-2xl">
          <Text className="text-black font-black uppercase text-xs italic">Permitir Acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <View className="pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-white/5 bg-black/50 z-20">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="p-3 bg-white/5 rounded-full mr-4">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tight text-white italic">Escanear QR</Text>
        </View>
        <TouchableOpacity onPress={() => setShowTutorial(true)} style={{ borderColor: `${theme.secondary}33`, backgroundColor: `${theme.secondary}1A` }} className="p-3 rounded-full border">  
          <HelpCircle size={20} color={theme.secondary} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center relative">
        {status === 'idle' && (
          <View className="flex-1 absolute inset-0 z-0">
             <CameraView 
               style={StyleSheet.absoluteFillObject}
               onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
               barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
             />
             <View className="flex-1 bg-black/40 justify-center items-center">
                <View className="w-64 h-64 border-[3px] border-boston-gold/50 rounded-[40px] border-dashed items-center justify-center bg-black/10">
                   <View className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-boston-gold rounded-tl-[20px]" />
                   <View className="absolute -top-4 -right-4 w-8 h-8 border-t-4 border-r-4 border-boston-gold rounded-tr-[20px]" />
                   <View className="absolute -bottom-4 -left-4 w-8 h-8 border-b-4 border-l-4 border-boston-gold rounded-bl-[20px]" />
                   <View className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-boston-gold rounded-br-[20px]" />
                </View>
                <View className="bg-black/60 px-6 py-3 rounded-full mt-10 border border-white/10">
                  <Text style={{ color: theme.secondary }} className="font-bold uppercase text-[10px] tracking-widest text-center">Enfoque el código QR</Text>
                </View>
                <Text className="text-white/80 text-[11px] text-center mt-6 uppercase font-black tracking-[0.2em] px-10 leading-5">CENTRO DE ESCANEO UNIVERSAL</Text>
                <Text className="text-white/40 text-[9px] text-center mt-2 uppercase tracking-[0.1em] px-12 leading-4">Apunta aquí para realizar pagos, hacer tu Check-in o sumar puntos con los códigos del Club.</Text>
             </View>
          </View>
        )}

        {status === 'loading' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
             <ActivityIndicator size="large" color={theme.secondary} className="mb-6 scale-150" />
             <Text className="text-sm font-bold uppercase tracking-widest text-white animate-pulse">Validando código...</Text>
          </View>
        )}

        {status === 'pos_waiting' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
             <ActivityIndicator size="large" color={theme.secondary} className="mb-6 scale-150" />
             <Text style={{ color: theme.secondary }} className="text-2xl font-black mb-4 uppercase italic text-center">ESPERANDO PAGO</Text>
             <Text className="text-white/60 text-sm mb-10 text-center font-medium leading-relaxed px-6">{message}</Text>
             <TouchableOpacity onPress={resetScanner} className="bg-white/10 px-8 py-4 rounded-2xl w-full border border-white/5">
               <Text className="text-white font-black text-xs uppercase tracking-widest text-center">Cancelar / Volver</Text>
             </TouchableOpacity>
          </View>
        )}

        {status === 'success' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
            <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-8 shadow-lg">
              <CheckCircle2 size={40} color="white" />
            </View>
            <Text className="text-2xl font-black mb-4 uppercase italic text-white text-center">¡Procesado!</Text>
            <Text className="text-white/60 text-sm mb-10 text-center font-medium leading-relaxed px-6">{message}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} className="bg-white px-8 py-4 rounded-2xl w-full">
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
            <Text className="text-white/60 text-sm mb-10 text-center font-medium leading-relaxed px-6">{message}</Text>
            <TouchableOpacity onPress={resetScanner} className="bg-white/10 px-8 py-4 rounded-2xl w-full border border-white/5">
              <Text className="text-white font-black text-xs uppercase tracking-widest text-center">Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
