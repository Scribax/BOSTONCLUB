import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flame, Users, Sparkles, Skull, ChevronRight, Moon, Ghost, FlaskConical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClubInfoProps } from './types';

const MissionCard = ({ icon: Icon, color, title, description, reward, accent = false, onPress }: any) => (
  <TouchableOpacity
     activeOpacity={0.9}
     onPress={onPress}
     className={`bg-[#0d0714] border ${accent ? 'border-[#ff7b00]/30' : 'border-white/5'} rounded-3xl p-6 flex-row items-center relative overflow-hidden mb-4`}
  >
     <View className="w-14 h-14 rounded-3xl items-center justify-center mr-5" style={{ backgroundColor: `${color}15` }}>
        <Icon size={28} color={color} />
     </View>
     <View className="flex-1">
        <Text className="text-white text-[18px] font-black italic tracking-tight uppercase">{title}</Text>
        <Text className="text-white/40 text-xs mt-1 leading-tight uppercase font-bold">{description}</Text>
     </View>
     {reward && (
        <View style={{ borderColor: `${color}4D` }} className="bg-black/60 border px-4 py-2 rounded-2xl items-center justify-center mr-2">
           <Text style={{ color: color }} className="text-sm font-black italic">+{reward}</Text>
        </View>
     )}
     <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
  </TouchableOpacity>
);

export default function ClubInfoHalloween(props: ClubInfoProps) {
  const router = useRouter();
  const { user, theme, isEnabled, pointsRate, referralPoints, streak, multiplier, progressWidth } = props;

  return (
    <SafeAreaView className="flex-1 bg-[#0a050f]">
       <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="relative">
             <LinearGradient colors={['#1a0b2e', '#0d0714', '#0a050f']} className="pt-14 pb-20 px-6">
                <TouchableOpacity onPress={() => router.back()} className="absolute top-14 left-6 z-20 w-11 h-11 bg-black/40 border border-white/10 rounded-3xl items-center justify-center backdrop-blur-md">
                   <ArrowLeft color={theme.primary} size={24} />
                </TouchableOpacity>
                <View style={{ borderColor: `${theme.primary}4D`, backgroundColor: 'rgba(0,0,0,0.3)' }} className="flex-row items-center gap-x-2 self-end mb-8 border rounded-3xl px-5 py-2">
                   <Skull size={18} color={theme.primary} />
                   <Text style={{ color: theme.primary }} className="text-sm font-black tracking-widest uppercase">{user?.membershipLevel || 'INICIADO'}</Text>
                </View>
                <Text style={{ color: theme.primary }} className="text-xs tracking-[4px] font-black mb-3">ALMAS OSCURAS</Text>
                <Text className="text-white text-[50px] font-black tracking-[-3px] leading-none">CONQUISTA EL{"\n"}INFRAMUNDO</Text>
                <Text className="text-white/60 text-lg mt-6 max-w-xs italic font-medium leading-6">Donde cada sacrificio se convierte en alma. Cada ritual en poder eterno.</Text>
             </LinearGradient>
             <View style={{ backgroundColor: `${theme.primary}1A` }} className="absolute bottom-0 left-0 right-0 h-px" />
          </View>

          <View className="px-6 -mt-8 mb-10 z-10">
             <View style={{ borderColor: `${theme.primary}33` }} className="bg-[#0d0714] border rounded-3xl p-8 shadow-2xl">
                <View className="flex-row justify-between items-center">
                   <View>
                      <View className="flex-row items-center">
                         <Flame size={16} color={theme.primary} fill={theme.primary} />
                         <Text style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-widest ml-2">MALDICIÓN ETERNA</Text>
                      </View>
                      <Text className="text-white text-5xl font-black tracking-tighter mt-1 italic">×{multiplier}</Text>
                   </View>
                   <View className="items-end">
                      <View style={{ backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` }} className="px-4 py-3 rounded-2xl border">
                         <Text style={{ color: theme.primary }} className="text-[10px] font-black uppercase italic tracking-widest">{streak} {streak === 1 ? 'ALMA CONSUMIDA' : 'ALMAS CONSUMIDAS'} 🔥</Text>
                      </View>
                   </View>
                </View>
                <View className="mt-8 h-2 bg-black rounded-full overflow-hidden border border-white/5">
                   <LinearGradient colors={[theme.primary, '#9d00ff']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: progressWidth as any, height: 8, borderRadius: 10 }} />
                </View>
                <View className="flex-row justify-between mt-3">
                   <Text className="text-white/10 text-[9px] font-black uppercase">Fugaz</Text>
                   <Text className="text-white/10 text-[9px] font-black uppercase">Vibrante</Text>
                   <Text className="text-white/10 text-[9px] font-black uppercase">Eterna</Text>
                </View>
             </View>
          </View>

          <View className="px-6 mb-12">
             <View style={{ borderColor: `${theme.primary}33` }} className="bg-[#0d0714] border rounded-3xl p-8 overflow-hidden">
                <View className="flex-row items-center justify-between">
                   <View className="items-center flex-1">
                      <View className="w-14 h-14 bg-black rounded-2xl items-center justify-center border border-white/10 mb-3">
                         <Text className="text-white text-2xl font-black italic">$</Text>
                      </View>
                      <Text className="text-white text-4xl font-black italic">$1</Text>
                   </View>
                   <View className="items-center px-4">
                      <Sparkles size={32} color={theme.primary} />
                      <Text style={{ color: theme.primary }} className="text-[8px] font-black tracking-[4px] mt-2 italic">ETERNO</Text>
                   </View>
                   <View className="items-center flex-1">
                      <View style={{ backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` }} className="w-14 h-14 rounded-2xl items-center justify-center border mb-3">
                         <Text className="text-white text-xl font-black italic">ALMA</Text>
                      </View>
                      <Text style={{ color: theme.primary }} className="text-5xl font-black italic">{pointsRate}</Text>
                   </View>
                </View>
                <View style={{ borderTopColor: 'rgba(255,255,255,0.05)' }} className="mt-8 pt-6 border-t">
                   <Text className="text-center text-white/30 text-[10px] font-black leading-relaxed uppercase tracking-widest italic">1 peso = {pointsRate} ALMA • Cosecha inmediata en tu cuenta</Text>
                </View>
             </View>
          </View>

          <View className="px-6 mb-12">
             <View className="flex-row items-center justify-between mb-6 px-2">
                <Text className="text-white/30 uppercase text-[10px] font-black tracking-[0.3em] italic">Rituales de Sangre</Text>
                <TouchableOpacity onPress={() => router.push('/history')}>
                   <Text style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-widest italic">Ver actividad →</Text>
                </TouchableOpacity>
             </View>
             <View>
                {isEnabled('enable_referrals') && (
                   <MissionCard icon={Users} color="#3B82F6" title="Nuevos Adeptos" description="Trae almas al club" reward={`${referralPoints}`} accent onPress={() => router.push('/(tabs)/profile')} />
                )}
                <MissionCard icon={Sparkles} color="#10B981" title="Sellar Entrada" description="Escanea el QR al llegar" onPress={() => router.push('/(tabs)/scanner')} />
                <MissionCard icon={FlaskConical} color={theme.primary} title="Ritual de Barra" description="Usa el QR del POSNET" onPress={() => router.push('/(tabs)/scanner')} />
             </View>
          </View>

          <View className="px-6 pb-16">
             <TouchableOpacity onPress={() => router.back()} activeOpacity={0.9} style={{ borderColor: `${theme.primary}66` }} className="h-20 rounded-3xl overflow-hidden border shadow-2xl">
                <LinearGradient colors={[theme.primary, '#9d00ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="flex-1 items-center justify-center">
                   <Text className="text-black text-xl font-black uppercase italic tracking-widest">EL PACTO SE HA SELLADO</Text>
                </LinearGradient>
             </TouchableOpacity>
          </View>
       </ScrollView>
    </SafeAreaView>
  );
}
