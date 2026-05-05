import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flame, Skull, Ghost, Moon, Sparkles } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { StatusBar } from 'expo-status-bar';
import { RewardQRProps } from './types';

export default function RewardQRHalloween(props: RewardQRProps) {
  const router = useRouter();
  const { token, reward, isCompleted, timeLeft, totpTimestamp, cancelling, handleCancel, theme, fadeAnim } = props;

  return (
    <View className="flex-1 bg-[#0a050f]">
      <StatusBar style="light" />
      <View style={{ backgroundColor: theme.primary }} className="absolute top-0 right-0 w-80 h-80 opacity-[0.05] rounded-full blur-[100px]" />
      
      <View className="pt-16 pb-4 px-6 flex-row items-center relative z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/5">
          <ArrowLeft size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 relative z-10">
        <View className="flex-1 justify-center items-center py-6">
           <Animated.View style={{ opacity: fadeAnim }} className="w-full">
              <View style={{ borderColor: `${theme.primary}33` }} className="bg-[#0d0714] border rounded-[3rem] p-8 items-center shadow-2xl overflow-hidden relative">
                 <View style={{ borderColor: `${theme.primary}20` }} className="absolute -left-6 top-1/2 w-12 h-12 bg-[#0a050f] rounded-full border" />
                 <View style={{ borderColor: `${theme.primary}20` }} className="absolute -right-6 top-1/2 w-12 h-12 bg-[#0a050f] rounded-full border" />
                 
                 <View className="flex-row items-center w-full mb-8">
                   <View style={{ borderColor: isCompleted ? '#4ade80' : `${theme.primary}4D`, backgroundColor: isCompleted ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)' }} className="w-14 h-14 rounded-2xl items-center justify-center mr-4 border">
                     {isCompleted ? <Sparkles size={28} color="#22c55e" /> : <Flame size={28} color={theme.primary} />}
                   </View>
                   <View className="flex-1">
                     <Text style={{ color: isCompleted ? '#4ade80' : theme.primary }} className="text-[10px] font-black uppercase tracking-widest mb-1">
                       {isCompleted ? 'Pacto Cumplido' : 'Sello de Invocación'}
                     </Text>
                     <Text className="text-white font-black text-xl italic uppercase tracking-tighter" numberOfLines={2}>
                       {reward}
                     </Text>
                   </View>
                 </View>

                 {isCompleted ? (
                   <View className="py-10 items-center">
                     <Ghost size={48} color="white" style={{ marginBottom: 16, opacity: 0.8 }} />
                     <Text className="text-white font-black text-3xl uppercase tracking-tighter mb-2 text-center">¡QUE ASÍ SEA!</Text>
                     <Text className="text-white/50 text-xs font-medium text-center uppercase tracking-widest leading-relaxed">El alma ha sido entregada. Disfruta tu recompensa terrenal.</Text>
                   </View>
                 ) : (
                   <>
                     <View style={{ borderColor: `${theme.primary}66` }} className="bg-white/90 p-6 rounded-3xl shadow-2xl mb-6 relative overflow-hidden border-2">
                        <QRCode value={`${token}|${totpTimestamp}`} size={200} color="#000" backgroundColor="transparent" />
                     </View>

                     <View className="w-full mb-8 items-center">
                        <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-3">
                           Energía renovando en <Text style={{ color: theme.primary }}>{timeLeft}s</Text>
                        </Text>
                        <View className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <View style={{ width: `${(timeLeft / 30) * 100}%`, backgroundColor: theme.primary }} className="h-full rounded-full" />
                        </View>
                     </View>

                     <Text style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.4em] mb-3 text-center">
                       Protección del Aquelarre
                     </Text>
                     <Text className="text-white/40 text-[11px] font-medium text-center uppercase tracking-tight leading-relaxed">
                       El sello muta cada 30 segundos.{"\n"}Las ilusiones (capturas) no funcionarán.
                     </Text>
                   </>
                 )}
              </View>

              <TouchableOpacity activeOpacity={0.8} onPress={() => router.replace('/(tabs)')} className="w-full mt-10 rounded-[2rem] overflow-hidden">
                 <LinearGradient colors={[`${theme.primary}80`, theme.primary]} start={{x:0, y:0}} end={{x:1, y:0}} className="py-5 items-center flex-row justify-center">
                    <Moon size={18} color="black" style={{ marginRight: 12 }} />
                    <Text className="text-sm font-black text-black uppercase tracking-[0.2em]">Regresar al Portal</Text>
                 </LinearGradient>
               </TouchableOpacity>

               {!isCompleted && (
                 <TouchableOpacity activeOpacity={0.8} onPress={handleCancel} disabled={cancelling} className="w-full mt-4 items-center py-4">
                    {cancelling ? (
                       <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                       <Text style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Deshacer Invocación</Text>
                    )}
                 </TouchableOpacity>
               )}
           </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
