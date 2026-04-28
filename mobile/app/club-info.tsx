import React from 'react';
import {
   View,
   Text,
   ScrollView,
   TouchableOpacity,
   SafeAreaView,
   Dimensions,
   ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
   ArrowLeft,
   Flame,
   Users,
   Zap,
   Coins,
   ChevronRight,
   Sparkles,
   Crown,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';

interface AppSettings {
   pointsPerPeso?: number;
   referralRewardReferrer?: number;
}

const GOLD = '#E8C670';
const DEEP_GOLD = '#B38B2E';

export default function ClubInfoScreen() {
   const router = useRouter();
   const [settings, setSettings] = React.useState<AppSettings | null>(null);
   const [user, setUser] = React.useState<any>(null);
   const [loading, setLoading] = React.useState(true);

   React.useEffect(() => {
      fetchData();
   }, []);

   const fetchData = async () => {
      try {
         const [settingsRes, userRes] = await Promise.all([
            api.get('/settings'),
            api.get('/auth/me')
         ]);
         setSettings(settingsRes.data);
         setUser(userRes.data);
      } catch (err) {
         console.error('Error fetching data:', err);
      } finally {
         setLoading(false);
      }
   };

   const pointsRate = settings?.pointsPerPeso ?? 1.0;
   const referralPoints = settings?.referralRewardReferrer ?? 500;
   
   // Lógica de racha real
   const streak = user?.streak || 0;
   let multiplier = "1.0";
   let progressWidth = "10%";
   
   if (streak >= 7) {
      multiplier = "2.0";
      progressWidth = "100%";
   } else if (streak >= 3) {
      multiplier = "1.5";
      progressWidth = "50%";
   } else if (streak > 0) {
      multiplier = "1.0";
      progressWidth = "20%";
   }

   const MissionCard = ({
      icon: Icon,
      color,
      title,
      description,
      reward,
      accent = false,
      onPress,
   }: {
      icon: any;
      color: string;
      title: string;
      description: string;
      reward?: string;
      accent?: boolean;
      onPress?: () => void;
   }) => (
      <TouchableOpacity
         activeOpacity={0.9}
         onPress={onPress}
         className={`bg-[#0f0f0f] border ${accent ? 'border-[#E8C670]/30' : 'border-white/10'} rounded-3xl p-6 flex-row items-center relative overflow-hidden`}
      >
         {accent && (
            <LinearGradient
               colors={['transparent', 'rgba(232, 198, 112, 0.15)', 'transparent']}
               className="absolute -inset-4 rotate-12"
               style={{ width: '200%' }}
            />
         )}

         <View
            className="w-14 h-14 rounded-3xl items-center justify-center mr-5"
            style={{ backgroundColor: `${color}15` }}
         >
            <Icon size={28} color={color} />
         </View>

         <View className="flex-1">
            <Text className="text-white text-[18px] font-semibold tracking-tight">{title}</Text>
            <Text className="text-white/60 text-sm mt-1 leading-tight">{description}</Text>
         </View>

         {reward && (
            <View className="bg-black/60 border border-white/20 px-4 py-2 rounded-2xl items-center justify-center mr-2">
               <Text className="text-[#E8C670] text-sm font-bold tabular-nums">+{reward}</Text>
            </View>
         )}

         <ChevronRight size={18} color="#888" />
      </TouchableOpacity>
   );

   if (loading) {
      return (
         <SafeAreaView className="flex-1 bg-black items-center justify-center">
            <ActivityIndicator size="large" color={GOLD} />
         </SafeAreaView>
      );
   }

   return (
      <SafeAreaView className="flex-1 bg-black">
         <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <View className="relative">
               <LinearGradient
                  colors={['#1C1408', '#0F0A05', '#000000']}
                  className="pt-14 pb-20 px-6"
               >
                  <TouchableOpacity
                     onPress={() => router.back()}
                     className="absolute top-14 left-6 z-20 w-11 h-11 bg-black/40 border border-white/10 rounded-3xl items-center justify-center backdrop-blur-md"
                  >
                     <ArrowLeft color="#E8C670" size={24} />
                  </TouchableOpacity>

                  <View className="flex-row items-center gap-x-2 self-end mb-8 bg-black/30 border border-[#E8C670]/30 rounded-3xl px-5 py-2">
                     <Crown size={18} color={GOLD} />
                     <Text className="text-[#E8C670] text-sm font-bold tracking-widest uppercase">{user?.membershipLevel || 'BRONCE'}</Text>
                  </View>

                  <Text className="text-[#E8C670] text-xs tracking-[4px] font-medium mb-3">EXPERIENCE VIP</Text>

                  <Text className="text-white text-[52px] font-black tracking-[-3px] leading-none">
                     DOMINA{'\n'}EL CLUB
                  </Text>

                  <Text className="text-white/70 text-lg mt-6 max-w-xs">
                     Donde cada peso se convierte en poder. Cada misión en estatus.
                  </Text>
               </LinearGradient>
               <View className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
            </View>

            {/* STREAK WIDGET - Dynamic Data */}
            <View className="px-6 -mt-8 mb-10 z-10">
               <View className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <View className="flex-row justify-between items-center">
                     <View>
                        <View className="flex-row items-center">
                           <Flame size={16} color="#FF3B30" />
                           <Text className="text-[#FF3B30] text-[10px] font-black uppercase tracking-widest ml-1">RACHA ACTIVA</Text>
                        </View>
                        <Text className="text-white text-5xl font-black tracking-tighter mt-1">×{multiplier}</Text>
                     </View>

                     <View className="items-end">
                        <View className="bg-[#FF3B30]/10 px-4 py-3 rounded-2xl border border-[#FF3B30]/20">
                           <Text className="text-[#FF3B30] text-xs font-black uppercase italic">{streak} {streak === 1 ? 'DÍA CONSECUTIVO' : 'DÍAS CONSECUTIVOS'} 🔥</Text>
                        </View>
                     </View>
                  </View>

                  <View className="mt-8 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                     <LinearGradient
                        colors={[GOLD, '#FF3B30']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={{ width: progressWidth, height: '100%', borderRadius: 10 }}
                     />
                  </View>

                  <View className="flex-row justify-between mt-3">
                     <Text className="text-white/20 text-[9px] font-black">×1.0</Text>
                     <Text className="text-white/20 text-[9px] font-black">×1.5</Text>
                     <Text className="text-white/20 text-[9px] font-black">×2.0</Text>
                  </View>
               </View>
            </View>

            {/* CONVERSIÓN - Fixed overlapping icons */}
            <View className="px-6 mb-12">
               <View className="bg-[#111] border border-[#E8C670]/10 rounded-3xl p-8 overflow-hidden">
                  <View className="flex-row items-center justify-between">
                     <View className="items-center flex-1">
                        <View className="w-14 h-14 bg-black rounded-2xl items-center justify-center border border-white/10 mb-3">
                           <Text className="text-white text-2xl font-black">$</Text>
                        </View>
                        <Text className="text-white text-4xl font-black">$1</Text>
                     </View>

                     <View className="items-center px-4">
                        <Zap size={32} color={GOLD} />
                        <Text className="text-[#E8C670] text-[8px] font-black tracking-[2px] mt-2">INSTANT</Text>
                     </View>

                     <View className="items-center flex-1">
                        <View className="w-14 h-14 bg-[#E8C670]/10 rounded-2xl items-center justify-center border border-[#E8C670]/30 mb-3">
                           <Text className="text-[#E8C670] text-xl font-black italic">PTS</Text>
                        </View>
                        <Text className="text-[#E8C670] text-5xl font-black italic">{pointsRate}</Text>
                     </View>
                  </View>

                  <View className="mt-8 pt-6 border-t border-white/5">
                     <Text className="text-center text-white/40 text-[11px] font-medium leading-relaxed uppercase tracking-wider">
                        1 peso = {pointsRate} puntos • Crédito inmediato en tu cuenta VIP
                     </Text>
                  </View>
               </View>
            </View>

            {/* MISIONES */}
            <View className="px-6 mb-12">
               <View className="flex-row items-center justify-between mb-6 px-2">
                  <Text className="text-white/40 uppercase text-[10px] font-black tracking-widest">Misiones Élite</Text>
                  <TouchableOpacity onPress={() => router.push('/history')}>
                     <Text className="text-[#E8C670] text-[10px] font-black uppercase tracking-widest">Ver actividad →</Text>
                  </TouchableOpacity>
               </View>

            <View className="gap-y-4">
               <MissionCard
                  icon={Users}
                  color="#3B82F6"
                  title="Invita y conquista"
                  description="Trae amigos al club"
                  reward={`${referralPoints}`}
                  accent
                  onPress={() => router.push('/(tabs)/profile')}
               />
               <MissionCard
                  icon={Sparkles}
                  color="#10B981"
                  title="Daily check-in"
                  description="Suma por solo abrir la App"
                  onPress={() => router.push('/(tabs)/scanner')}
               />
               <MissionCard
                  icon={Coins}
                  color={GOLD}
                  title="Escanea en barra"
                  description="Usa el QR del POSNET"
                  onPress={() => router.push('/(tabs)/scanner')}
               />
            </View>
            </View>

            {/* FINAL CTA */}
            <View className="px-6 pb-16">
               <TouchableOpacity
                  onPress={() => router.back()}
                  activeOpacity={0.95}
                  className="h-20 rounded-3xl overflow-hidden border border-[#E8C670]/30 shadow-2xl shadow-boston-gold/20"
               >
                  <LinearGradient
                     colors={[GOLD, DEEP_GOLD]}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 1 }}
                     className="flex-1 items-center justify-center"
                  >
                     <Text className="text-black text-xl font-black uppercase italic tracking-widest">Entendido, soy VIP</Text>
                  </LinearGradient>
               </TouchableOpacity>
            </View>
         </ScrollView>
      </SafeAreaView>
   );
}