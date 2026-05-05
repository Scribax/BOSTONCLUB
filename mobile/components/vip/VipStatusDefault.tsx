import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { X, Crown, Star, ArrowRight, Shield, Zap, RefreshCcw, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VipStatusProps } from './types';

export default function VipStatusDefault(props: VipStatusProps) {
  const { isVisible, onClose, user, settings, benefits, loading, redeemingId, handleRedeem, fetchBenefits, theme, nextTier } = props;

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-end">
        <View className="w-full bg-[#050505] rounded-t-[40px] border-t border-white/10 h-[92%] overflow-hidden">
          <View className="w-full items-center pt-3 pb-2 absolute top-0 z-[100]">
            <View className="w-10 h-1 bg-white/20 rounded-full" />
          </View>

          <View className="h-[220px] relative">
            <LinearGradient 
              colors={
                user?.membershipLevel === 'ORO' ? ['#D4AF37', '#8A6D3B', '#050505'] :
                user?.membershipLevel === 'PLATINO' ? ['#E5E4E2', '#A9A9A9', '#050505'] :
                user?.membershipLevel === 'DIAMANTE' ? ['#22D3EE', '#0891B2', '#050505'] :
                user?.membershipLevel === 'SÚPER VIP' ? ['#FF3B30', '#CC0000', '#050505'] :
                ['#881B16', '#440D0B', '#050505']
              } 
              className="absolute inset-0" 
            />
            
            <View className="p-8 flex-1 justify-end">
              <TouchableOpacity onPress={onClose} className="absolute top-8 right-6 w-9 h-9 rounded-full bg-black/30 items-center justify-center z-50">
                <X size={18} color="white" />
              </TouchableOpacity>
              
              <View className="flex-row items-center mb-2">
                <View className="px-2 py-0.5 bg-white/20 rounded mr-2">
                   <Text className="text-white text-[8px] font-black uppercase">Estatus Actual</Text>
                </View>
                <Crown size={12} color="white" />
              </View>

              <Text className="text-white text-5xl font-black italic uppercase tracking-tighter leading-[52px]">
                {user?.membershipLevel || 'BRONCE'}
              </Text>
              
              <View className="flex-row items-center mt-3">
                <Star size={14} color={theme.secondary} fill={theme.secondary} />
                <Text className="text-white font-bold ml-1.5 text-sm">{user?.points.toLocaleString()} <Text className="text-white/50 text-[10px]">PUNTOS TOTALES</Text></Text>
              </View>
            </View>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ padding: 24, paddingBottom: 60 }} 
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBenefits} tintColor={theme.secondary} />}
          >
            <View className="mb-10">
              <View className="flex-row items-center mb-5 justify-between">
                <View className="flex-row items-center">
                  <Zap size={16} color={theme.secondary} fill={theme.secondary} />
                  <Text className="text-white text-[13px] font-black uppercase italic ml-2.5">Tus Beneficios Activos</Text>
                </View>
                <Text className="text-white/30 text-[9px] font-bold">{benefits.filter(b => !b.isLocked).length} DISPONIBLES</Text>
              </View>

              {loading && benefits.length === 0 ? (
                <ActivityIndicator color={theme.secondary} className="mt-5" />
              ) : benefits.filter(b => !b.isLocked).length === 0 ? (
                <View className="p-10 bg-white/5 rounded-[32px] items-center border border-white/5">
                  <Lock size={24} color="rgba(255,255,255,0.1)" />
                  <Text className="text-white/20 text-[11px] font-bold uppercase text-center mt-3">Aún no tienes beneficios en este nivel</Text>
                </View>
              ) : (
                <View className="gap-y-4">
                  {benefits.filter(b => !b.isLocked).map((benefit: any) => (
                    <View key={benefit.id} className="bg-[#111] rounded-[28px] overflow-hidden border border-white/5">
                      <LinearGradient colors={[`${theme.secondary}14`, 'transparent']} className="p-5">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1 mr-4">
                            <Text className="text-white font-black text-lg uppercase italic mb-1">{benefit.title}</Text>
                            <Text className="text-white/40 text-[10px] font-semibold leading-3.5">{benefit.description || 'Disfruta de este beneficio exclusivo por ser socio Boston.'}</Text>
                          </View>
                           <View style={{ backgroundColor: `${theme.secondary}1A` }} className="w-11 h-11 rounded-2xl items-center justify-center">
                            <Shield size={20} color={theme.secondary} />
                          </View>
                        </View>
                        <View className="h-[1px] bg-white/5 my-4 border-dashed rounded" />
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <RefreshCcw size={10} color="rgba(255,255,255,0.3)" />
                            <Text className="text-white/30 text-[9px] font-black uppercase ml-1.5 tracking-wider">
                              {benefit.redemptionPolicy === 'ONCE_TOTAL' ? 'Un solo uso' : benefit.redemptionPolicy === 'ONCE_PER_NIGHT' ? '1 vez por noche' : 'Uso ilimitado'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleRedeem(benefit)}
                            disabled={redeemingId === benefit.id}
                            style={{ backgroundColor: theme.secondary }}
                            className="rounded-xl px-4 py-2.5 flex-row items-center"
                          >
                            {redeemingId === benefit.id ? <ActivityIndicator size="small" color="black" /> : (
                              <>
                                <Text className="text-black font-black text-[11px] uppercase mr-1.5">Canjear</Text>
                                <ArrowRight size={12} color="black" />
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {nextTier && (
              <View className="mb-10">
                <View className="flex-row items-center mb-5">
                  <Lock size={16} color={theme.primary} />
                  <Text style={{ color: theme.primary }} className="text-[13px] font-black uppercase italic ml-2.5">Próximos Desbloqueos: {nextTier.name}</Text>
                </View>
                <View style={{ borderColor: `${theme.primary}1A` }} className="bg-[#0f0f0f] rounded-[32px] p-6 border">
                  <Text className="text-white/20 text-[10px] font-black uppercase mb-4 tracking-wider">Beneficios de Nivel {nextTier.name}:</Text>
                  <View className="gap-y-3.5">
                      {benefits.filter(b => b.level === nextTier.name).length > 0 ? (
                        benefits.filter(b => b.level === nextTier.name).slice(0, 3).map((benefit: any) => (
                          <View key={benefit.id} className="flex-row items-center">
                            <View style={{ backgroundColor: `${theme.primary}4D` }} className="w-1.5 h-1.5 rounded-full mr-3" />
                            <Text className="flex-1 text-white/50 text-[13px] font-semibold italic">{benefit.title}</Text>
                          </View>
                        ))
                      ) : (
                        <Text className="text-white/20 text-[11px] italic">Explora beneficios exclusivos al subir de rango.</Text>
                      )}
                  </View>
                  <View style={{ backgroundColor: `${theme.primary}0D`, borderColor: `${theme.primary}1A` }} className="mt-6 flex-row items-center justify-between p-4 rounded-2xl border">
                    <View>
                      <Text className="text-white/40 text-[8px] font-black uppercase mb-0.5">Te faltan</Text>
                      <Text className="text-white font-black text-base">{(nextTier.pointsNeeded - user.points).toLocaleString()} <Text style={{ color: theme.primary }} className="text-[10px]">PTS</Text></Text>
                    </View>
                    <View style={{ backgroundColor: theme.primary }} className="px-3 py-1.5 rounded-lg">
                       <Text className="text-white font-black text-[10px]">Siguiente Nivel</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View>
              <Text className="text-white/15 text-[10px] font-black uppercase tracking-[0.2em] mb-5">Hoja de Ruta VIP</Text>
              <View className="gap-y-3">
                {[
                  { name: "ORO", pts: settings?.goldThreshold || 5000, color: '#D4AF37' },
                  { name: "PLATINO", pts: settings?.platinumThreshold || 20000, color: '#E5E4E2' },
                  { name: "DIAMANTE", pts: settings?.diamondThreshold || 50000, color: '#22D3EE' },
                  { name: "SÚPER VIP", pts: settings?.superVipThreshold || 100000, color: '#FF3B30' },
                ].filter(t => {
                  const tiers = ['BRONCE', 'ORO', 'PLATINO', 'DIAMANTE', 'SÚPER VIP'];
                  return tiers.indexOf(t.name) > tiers.indexOf(user.membershipLevel);
                }).map((tier, idx) => (
                  <View key={idx} className="flex-row items-center justify-between p-5 bg-white/[0.01] rounded-3xl border border-white/[0.03]">
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-xl bg-white/[0.03] items-center justify-center mr-4">
                        <Star size={16} color={tier.color} fill={tier.color + '20'} />
                      </View>
                      <View>
                        <Text style={{ color: tier.color }} className="font-black text-base italic uppercase tracking-tighter">{tier.name}</Text>
                        <Text className="text-white/20 text-[9px] font-black">META: {tier.pts.toLocaleString()} PUNTOS</Text>
                      </View>
                    </View>
                    <ArrowRight size={14} color="rgba(255,255,255,0.1)" />
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
