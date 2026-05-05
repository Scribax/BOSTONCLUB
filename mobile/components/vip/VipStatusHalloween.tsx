import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { X, Skull, Moon, Flame, ArrowRight, Shield, Sparkles, RefreshCcw, Lock, Ghost, FlaskConical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VipStatusProps } from './types';

export default function VipStatusHalloween(props: VipStatusProps) {
  const { isVisible, onClose, user, settings, benefits, loading, redeemingId, handleRedeem, fetchBenefits, theme, nextTier } = props;

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/90 justify-end">
        <View style={{ borderColor: `${theme.primary}33` }} className="w-full bg-[#0a050f] rounded-t-[50px] border-t-2 h-[94%] overflow-hidden">
          
          <View className="w-full items-center pt-4 pb-2 absolute top-0 z-[100]">
            <View style={{ backgroundColor: `${theme.primary}33` }} className="w-12 h-1.5 rounded-full" />
          </View>

          {/* Status Header */}
          <View className="h-[260px] relative">
            <LinearGradient 
              colors={['#1a0b2e', '#0d0714', '#0a050f']} 
              className="absolute inset-0" 
            />
            
            {/* Animated Aura */}
            <View style={{ backgroundColor: theme.primary }} className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-20 blur-[80px]" />
            
            <View className="p-10 flex-1 justify-end">
              <TouchableOpacity onPress={onClose} className="absolute top-10 right-8 w-10 h-10 rounded-full bg-black/40 items-center justify-center z-50 border border-white/10">
                <X size={20} color="white" />
              </TouchableOpacity>
              
              <View className="flex-row items-center mb-3">
                <View style={{ backgroundColor: `${theme.primary}33` }} className="px-3 py-1 rounded-full mr-3 border border-white/10">
                   <Text style={{ color: theme.primary }} className="text-[9px] font-black uppercase tracking-widest">Jerarquía del Culto</Text>
                </View>
                <Skull size={14} color={theme.primary} />
              </View>

              <Text style={{ shadowColor: theme.primary, textShadowColor: `${theme.primary}66`, textShadowOffset: {width: 0, height: 0}, textShadowRadius: 15 }} className="text-white text-6xl font-black italic uppercase tracking-tighter leading-[58px]">
                {user?.membershipLevel || 'INICIADO'}
              </Text>
              
              <View className="flex-row items-center mt-5">
                <Flame size={16} color={theme.primary} fill={theme.primary} />
                <Text className="text-white font-black ml-2.5 text-lg italic">{user?.points.toLocaleString()} <Text style={{ color: theme.primary }} className="text-[10px] tracking-[0.2em] uppercase">Almas Recolectadas</Text></Text>
              </View>
            </View>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ padding: 28, paddingBottom: 80 }} 
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBenefits} tintColor={theme.primary} />}
          >
            {/* Current Powers */}
            <View className="mb-12">
              <View className="flex-row items-center mb-6 justify-between">
                <View className="flex-row items-center">
                  <Sparkles size={18} color={theme.primary} />
                  <Text className="text-white text-sm font-black uppercase italic ml-3 tracking-wider">Tus Poderes Activos</Text>
                </View>
                <View style={{ backgroundColor: `${theme.primary}1A` }} className="px-3 py-1 rounded-lg border border-white/5">
                   <Text style={{ color: theme.primary }} className="text-[9px] font-black uppercase tracking-widest">{benefits.filter(b => !b.isLocked).length} Conjuros</Text>
                </View>
              </View>

              {loading && benefits.length === 0 ? (
                <ActivityIndicator color={theme.primary} className="mt-10" />
              ) : benefits.filter(b => !b.isLocked).length === 0 ? (
                <View className="p-12 bg-black/40 rounded-[40px] items-center border border-white/5">
                  <Ghost size={32} color="rgba(255,255,255,0.1)" />
                  <Text className="text-white/20 text-[11px] font-black uppercase text-center mt-4 tracking-widest">Aún no has despertado poderes en este rango</Text>
                </View>
              ) : (
                <View className="gap-y-5">
                  {benefits.filter(b => !b.isLocked).map((benefit: any) => (
                    <View key={benefit.id} style={{ borderColor: `${theme.primary}20` }} className="bg-[#0d0714] rounded-[32px] overflow-hidden border">
                      <LinearGradient colors={[`${theme.primary}0D`, 'transparent']} className="p-6">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1 mr-4">
                            <Text className="text-white font-black text-xl uppercase italic mb-1.5 tracking-tighter">{benefit.title}</Text>
                            <Text className="text-white/40 text-[11px] font-medium leading-4 italic">{benefit.description || 'Poder otorgado por tu lealtad eterna al club.'}</Text>
                          </View>
                           <View style={{ backgroundColor: `${theme.primary}1A` }} className="w-12 h-12 rounded-2xl items-center justify-center border border-white/5">
                            <FlaskConical size={22} color={theme.primary} />
                          </View>
                        </View>

                        <View style={{ backgroundColor: `${theme.primary}1A` }} className="h-[1px] my-5 border-dashed rounded" />

                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Moon size={12} color={theme.primary} className="opacity-40" />
                            <Text className="text-white/30 text-[10px] font-black uppercase ml-2 tracking-wider italic">
                              {benefit.redemptionPolicy === 'ONCE_TOTAL' ? 'Un solo uso' : benefit.redemptionPolicy === 'ONCE_PER_NIGHT' ? '1 vez por noche' : 'Poder ilimitado'}
                            </Text>
                          </View>
                          
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleRedeem(benefit)}
                            disabled={redeemingId === benefit.id}
                            style={{ backgroundColor: theme.primary }}
                            className="rounded-2xl px-5 py-3 flex-row items-center shadow-xl"
                          >
                            {redeemingId === benefit.id ? <ActivityIndicator size="small" color="black" /> : (
                              <>
                                <Text className="text-black font-black text-xs uppercase mr-2 italic">Invocar</Text>
                                <Flame size={14} color="black" fill="black" />
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

            {/* Reincarnation Section */}
            {nextTier && (
              <View className="mb-12">
                <View className="flex-row items-center mb-6">
                  <Skull size={18} color="white" className="opacity-30" />
                  <Text className="text-white/30 text-sm font-black uppercase italic ml-3 tracking-widest">Próximas Reencarnaciones: {nextTier.name}</Text>
                </View>
                
                <View style={{ borderColor: `${theme.primary}33` }} className="bg-black/40 rounded-[40px] p-8 border-2">
                  <Text className="text-white/40 text-[10px] font-black uppercase mb-5 tracking-[0.2em] italic">Poderes de Rango {nextTier.name}:</Text>
                  
                  <View className="gap-y-4">
                      {benefits.filter(b => b.level === nextTier.name).length > 0 ? (
                        benefits.filter(b => b.level === nextTier.name).slice(0, 3).map((benefit: any) => (
                          <View key={benefit.id} className="flex-row items-center">
                            <View style={{ backgroundColor: theme.primary }} className="w-1.5 h-1.5 rounded-full mr-4 opacity-50" />
                            <Text className="flex-1 text-white/50 text-[14px] font-bold italic tracking-tight">{benefit.title}</Text>
                          </View>
                        ))
                      ) : (
                        <Text className="text-white/20 text-[12px] italic">Desbloquea misterios exclusivos al ascender.</Text>
                      )}
                  </View>

                  <View style={{ backgroundColor: `${theme.primary}0D`, borderColor: `${theme.primary}33` }} className="mt-8 flex-row items-center justify-between p-5 rounded-3xl border">
                    <View>
                      <Text className="text-white/40 text-[9px] font-black uppercase mb-1 italic">Energía Faltante</Text>
                      <Text className="text-white font-black text-xl italic tracking-tighter">{(nextTier.pointsNeeded - user.points).toLocaleString()} <Text style={{ color: theme.primary }} className="text-xs uppercase">Almas</Text></Text>
                    </View>
                    <View style={{ backgroundColor: theme.primary }} className="px-4 py-2 rounded-xl">
                       <Text className="text-black font-black text-[10px] uppercase">Ascender</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Future Lore */}
            <View>
              <Text className="text-white/10 text-[11px] font-black uppercase tracking-[0.5em] mb-6 text-center italic">El Camino del Inframundo</Text>
              <View className="gap-y-4">
                {[
                  { name: "ORO", pts: settings?.goldThreshold || 5000, color: '#D4AF37' },
                  { name: "PLATINO", pts: settings?.platinumThreshold || 20000, color: '#E5E4E2' },
                  { name: "DIAMANTE", pts: settings?.diamondThreshold || 50000, color: '#22D3EE' },
                  { name: "SÚPER VIP", pts: settings?.superVipThreshold || 100000, color: '#FF3B30' },
                ].filter(t => {
                  const tiers = ['BRONCE', 'ORO', 'PLATINO', 'DIAMANTE', 'SÚPER VIP'];
                  return tiers.indexOf(t.name) > tiers.indexOf(user.membershipLevel);
                }).map((tier, idx) => (
                  <View key={idx} style={{ borderColor: 'rgba(255,255,255,0.05)' }} className="flex-row items-center justify-between p-6 bg-white/[0.02] rounded-[32px] border">
                    <View className="flex-row items-center">
                      <View style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} className="w-11 h-11 rounded-2xl items-center justify-center mr-5 border border-white/5">
                        <Moon size={18} color={tier.color} />
                      </View>
                      <View>
                        <Text style={{ color: tier.color }} className="font-black text-lg italic uppercase tracking-tighter">{tier.name}</Text>
                        <Text className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-1">META: {tier.pts.toLocaleString()} ALMAS</Text>
                      </View>
                    </View>
                    <ArrowRight size={16} color="rgba(255,255,255,0.1)" />
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
