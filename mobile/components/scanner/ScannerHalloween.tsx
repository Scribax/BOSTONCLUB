import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, ScrollView } from 'react-native';
import { CameraView } from 'expo-camera';
import { ArrowLeft, Skull, CheckCircle2, XCircle, HelpCircle, Flame, Moon, Sparkles, Ghost } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScannerProps } from './types';

export default function ScannerHalloween(props: ScannerProps) {
  const router = useRouter();
  const { permission, requestPermission, status, message, scanned, handleBarcodeScanned, resetScanner, showTutorial, setShowTutorial, theme } = props;

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#0a050f] items-center justify-center p-10">
        <Skull size={60} color={theme.primary} className="mb-6 opacity-20" />
        <Text className="text-white text-xl font-black uppercase italic text-center mb-4">Visión de Ultratumba</Text>
        <Text className="text-white/50 text-center mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
          Necesitamos despertar tu cámara para absorber la energía de los códigos y sellar tus pactos.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: theme.primary }} className="px-10 py-5 rounded-2xl">
          <Text className="text-black font-black uppercase text-xs italic">Despertar Cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a050f]">
      {/* Header */}
      <View className="pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-white/5 bg-[#0a050f]/80 z-20">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="p-3 bg-white/5 rounded-full mr-4">
            <ArrowLeft size={20} color={theme.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tight text-white italic">Centro de Conjuros</Text>
        </View>
        <TouchableOpacity onPress={() => setShowTutorial(true)} style={{ borderColor: `${theme.primary}33`, backgroundColor: `${theme.primary}1A` }} className="p-3 rounded-full border">  
          <Ghost size={20} color={theme.primary} />
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
             <View className="flex-1 bg-black/60 justify-center items-center">
                {/* Ritual Area */}
                <View style={{ borderColor: `${theme.primary}4D` }} className="w-64 h-64 border-[2px] rounded-[50px] border-dashed items-center justify-center bg-black/20">
                   <View style={{ borderColor: theme.primary }} className="absolute -top-4 -left-4 w-10 h-10 border-t-4 border-l-4 rounded-tl-[25px]" />
                   <View style={{ borderColor: theme.primary }} className="absolute -top-4 -right-4 w-10 h-10 border-t-4 border-r-4 rounded-tr-[25px]" />
                   <View style={{ borderColor: theme.primary }} className="absolute -bottom-4 -left-4 w-10 h-10 border-b-4 border-l-4 rounded-bl-[25px]" />
                   <View style={{ borderColor: theme.primary }} className="absolute -bottom-4 -right-4 w-10 h-10 border-b-4 border-r-4 rounded-br-[25px]" />
                   
                   <Sparkles size={24} color={theme.primary} className="opacity-40" />
                </View>

                <View style={{ borderColor: `${theme.primary}33` }} className="bg-black/80 px-8 py-4 rounded-full mt-10 border">
                  <Text style={{ color: theme.primary }} className="font-black uppercase text-[11px] tracking-[0.3em] text-center italic">Canaliza la Energía</Text>
                </View>

                <View className="mt-8 items-center px-10">
                   <Text className="text-white font-black text-[12px] uppercase tracking-[0.4em] mb-2">Alma del Aquelarre</Text>
                   <Text className="text-white/40 text-[10px] text-center uppercase tracking-widest leading-4">
                     Apunta tu cámara para absorber puntos y realizar pactos mágicos en Boston.
                   </Text>
                </View>
             </View>
          </View>
        )}

        {status === 'loading' && (
          <View className="items-center justify-center p-10 z-10 bg-[#0a050f] flex-1">
             <ActivityIndicator size="large" color={theme.primary} className="mb-6 scale-150" />
             <Text className="text-sm font-black uppercase tracking-[0.3em] text-white italic animate-pulse">Invocando...</Text>
          </View>
        )}

        {status === 'pos_waiting' && (
          <View className="items-center justify-center p-10 z-10 bg-[#0a050f] flex-1">
             <Flame size={60} color={theme.primary} className="mb-6" />
             <Text style={{ color: theme.primary }} className="text-2xl font-black mb-4 uppercase italic text-center">PAGO EN EL LIMBO</Text>
             <Text className="text-white/60 text-sm mb-12 text-center font-medium leading-relaxed px-6">
               Esperando la confirmación de tu sacrificio... mantén la conexión abierta.
             </Text>
             <TouchableOpacity onPress={resetScanner} className="bg-white/5 px-8 py-5 rounded-3xl w-full border border-white/10">
               <Text className="text-white font-black text-xs uppercase tracking-widest text-center italic">Deshacer Conexión</Text>
             </TouchableOpacity>
          </View>
        )}

        {status === 'success' && (
          <View className="items-center justify-center p-10 z-10 bg-[#0a050f] flex-1">
            <View style={{ backgroundColor: theme.primary }} className="w-24 h-24 rounded-full items-center justify-center mb-8 shadow-2xl">
              <CheckCircle2 size={48} color="black" />
            </View>
            <Text className="text-3xl font-black mb-4 uppercase italic text-white text-center">¡PACTO SELLADO!</Text>
            <Text className="text-white/60 text-sm mb-12 text-center font-medium leading-relaxed px-6">{message}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{ backgroundColor: theme.primary }} className="px-10 py-5 rounded-3xl w-full">
              <Text className="text-black font-black text-xs uppercase tracking-widest text-center">Regresar al Portal</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View className="items-center justify-center p-10 z-10 bg-[#0a050f] flex-1">
            <XCircle size={60} color={theme.primary} className="mb-8" />
            <Text className="text-3xl font-black mb-4 uppercase italic text-white text-center">MALDICIÓN</Text>
            <Text className="text-white/60 text-sm mb-12 text-center font-medium leading-relaxed px-6">
              {message}
            </Text>
            <TouchableOpacity onPress={resetScanner} className="bg-white/5 px-8 py-5 rounded-3xl w-full border border-white/10">
              <Text className="text-white font-black text-xs uppercase tracking-widest text-center italic">Intentar de Nuevo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
