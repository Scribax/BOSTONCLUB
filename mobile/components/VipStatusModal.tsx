import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { X, Crown, Flame, Star, ArrowRight, Shield, Zap, RefreshCcw, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';

interface VipStatusModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: any;
  settings: any;
  onRedeemSuccess?: (token: string, rewardName: string) => void;
}

export const VipStatusModal = ({ isVisible, onClose, user, settings, onRedeemSuccess }: VipStatusModalProps) => {
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      fetchBenefits();
    }
  }, [isVisible]);

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vip-benefits/me');
      setBenefits(res.data);
    } catch (err) {
      console.error('Error fetching benefits in modal', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (benefit: any) => {
    if (benefit.isLocked) return;
    setRedeemingId(benefit.id);
    try {
      const res = await api.post('/redemptions/generate', { vipBenefitId: benefit.id });
      onClose();
      if (onRedeemSuccess) {
        onRedeemSuccess(res.data.qrToken, benefit.title);
      }
    } catch (err: any) {
      console.error('Redeem error', err);
    } finally {
      setRedeemingId(null);
    }
  };

  const calculateNextTier = () => {
    if (!user || !settings) return undefined;
    const pts = user.points;
    let nextTierName = "";
    let nextTierPts = 0;
    let currentTierPts = 0;

    if (pts < settings.goldThreshold) {
      nextTierName = "ORO";
      nextTierPts = settings.goldThreshold;
      currentTierPts = 0;
    } else if (pts < settings.platinumThreshold) {
      nextTierName = "PLATINO";
      nextTierPts = settings.platinumThreshold;
      currentTierPts = settings.goldThreshold;
    } else if (pts < settings.diamondThreshold) {
      nextTierName = "DIAMANTE";
      nextTierPts = settings.diamondThreshold;
      currentTierPts = settings.platinumThreshold;
    } else if (pts < settings.superVipThreshold) {
      nextTierName = "SÚPER VIP";
      nextTierPts = settings.superVipThreshold;
      currentTierPts = settings.diamondThreshold;
    } else {
      return undefined;
    }

    return {
      name: nextTierName,
      pointsNeeded: nextTierPts,
    };
  };

  const nextTier = calculateNextTier();

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
        <View style={{ width: '100%', backgroundColor: '#0c0c0c', borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', height: '90%', overflow: 'hidden' }}>
          
          {/* Status Header */}
          <View style={{ height: 180, position: 'relative' }}>
            <LinearGradient colors={['#FF3B30', '#881B16', '#0c0c0c']} style={{ position: 'absolute', inset: 0 }} />
            <View style={{ padding: 32, flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity 
                onPress={onClose} 
                style={{ position: 'absolute', top: 24, right: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} color="white" />
              </TouchableOpacity>
              
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Tu Estatus Actual</Text>
              <Text style={{ color: 'white', fontSize: 44, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -2 }}>{user?.membershipLevel || 'BRONCE'}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 32, paddingBottom: 60 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBenefits} tintColor="#D4AF37" />}>
            
            {/* Current Benefits */}
            <View style={{ marginBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Crown size={18} color="#D4AF37" />
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginLeft: 12, letterSpacing: 1 }}>Tus Beneficios</Text>
              </View>

              {loading && benefits.length === 0 ? (
                <ActivityIndicator color="#D4AF37" />
              ) : benefits.length === 0 ? (
                <View style={{ padding: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>No hay beneficios disponibles para tu nivel</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {benefits.filter(b => !b.isLocked).map((benefit: any) => (
                    <View key={benefit.id} style={{ backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', padding: 20 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', fontStyle: 'italic' }}>{benefit.title}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                             <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                              {benefit.redemptionPolicy === 'ONCE_TOTAL' ? 'Una sola vez' : benefit.redemptionPolicy === 'ONCE_PER_NIGHT' ? 'Una vez por noche' : 'Ilimitado'}
                            </Text>
                          </View>
                        </View>
                        {benefit.redemptionPolicy === 'ONCE_PER_NIGHT' ? <RefreshCcw size={16} color="rgba(255,255,255,0.2)" /> : <Zap size={16} color="rgba(255,255,255,0.2)" />}
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleRedeem(benefit)}
                        disabled={redeemingId === benefit.id}
                        style={{ backgroundColor: 'rgba(212,175,55,0.12)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' }}
                      >
                        {redeemingId === benefit.id ? <ActivityIndicator size="small" color="#D4AF37" /> : <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>✦ Activar Beneficio</Text>}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Incentive Section */}
            {nextTier && (
              <View style={{ marginBottom: 40 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <Flame size={18} color="#FF3B30" />
                  <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginLeft: 12, letterSpacing: 1 }}>Desbloquea en Rango {nextTier.name}</Text>
                </View>
                
                <View style={{ padding: 24, backgroundColor: 'rgba(255,59,48,0.05)', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)', borderStyle: 'dashed' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>Lo que te estás perdiendo:</Text>
                  <View style={{ gap: 16 }}>
                      {benefits.filter(b => b.level === nextTier.name).slice(0, 3).map((benefit: any) => (
                        <View key={benefit.id} style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.6 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 12 }} />
                          <Text style={{ flex: 1, color: 'white', fontSize: 12, fontWeight: '500', fontStyle: 'italic' }}>{benefit.title}</Text>
                        </View>
                      ))}
                  </View>
                  <View style={{ marginTop: 24, alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>A solo {nextTier.pointsNeeded - user.points} pts</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Future Tiers */}
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Próximas Metas</Text>
              <View style={{ gap: 12 }}>
                {[
                  { name: "ORO", pts: settings?.goldThreshold || 5000, color: '#D4AF37' },
                  { name: "PLATINO", pts: settings?.platinumThreshold || 20000, color: '#FFFFFF' },
                  { name: "DIAMANTE", pts: settings?.diamondThreshold || 50000, color: '#22D3EE' },
                  { name: "SÚPER VIP", pts: settings?.superVipThreshold || 100000, color: '#FF3B30' },
                ].filter(t => {
                  const tiers = ['BRONCE', 'ORO', 'PLATINO', 'DIAMANTE', 'SÚPER VIP'];
                  return tiers.indexOf(t.name) > tiers.indexOf(user.membershipLevel);
                }).map((tier, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                        <Star size={14} color={tier.color} />
                      </View>
                      <View>
                        <Text style={{ color: tier.color, fontWeight: '900', fontSize: 14, fontStyle: 'italic', textTransform: 'uppercase' }}>{tier.name}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700' }}>META: {tier.pts} PUNTOS</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
