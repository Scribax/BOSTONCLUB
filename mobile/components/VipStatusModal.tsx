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

  return (    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View style={{ width: '100%', backgroundColor: '#050505', borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', height: '92%', overflow: 'hidden' }}>
          
          {/* Pull Bar */}
          <View style={{ width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 8, position: 'absolute', top: 0, zIndex: 100 }}>
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
          </View>

          {/* Status Header - DYNAMIC GRADIENT */}
          <View style={{ height: 220, position: 'relative' }}>
            <LinearGradient 
              colors={
                user?.membershipLevel === 'ORO' ? ['#D4AF37', '#8A6D3B', '#050505'] :
                user?.membershipLevel === 'PLATINO' ? ['#E5E4E2', '#A9A9A9', '#050505'] :
                user?.membershipLevel === 'DIAMANTE' ? ['#22D3EE', '#0891B2', '#050505'] :
                user?.membershipLevel === 'SÚPER VIP' ? ['#FF3B30', '#CC0000', '#050505'] :
                ['#881B16', '#440D0B', '#050505'] // BRONCE / DEFAULT
              } 
              style={{ position: 'absolute', inset: 0 }} 
            />
            
            {/* Mesh Pattern Overlay Placeholder */}
            <View style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundColor: 'transparent' }}>
               {/* Aquí se podría poner un pattern SVG o imagen */}
            </View>

            <View style={{ padding: 32, flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity 
                onPress={onClose} 
                style={{ position: 'absolute', top: 32, right: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
              >
                <X size={18} color="white" />
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginRight: 8 }}>
                   <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>Estatus Actual</Text>
                </View>
                <Crown size={12} color="white" />
              </View>

              <Text style={{ color: 'white', fontSize: 52, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -3, lineHeight: 52 }}>
                {user?.membershipLevel || 'BRONCE'}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Star size={14} color="#D4AF37" fill="#D4AF37" />
                <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 6, fontSize: 14 }}>{user?.points.toLocaleString()} <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>PUNTOS TOTALES</Text></Text>
              </View>
            </View>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ padding: 24, paddingBottom: 60 }} 
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBenefits} tintColor="#D4AF37" />}
          >
            
            {/* Current Benefits */}
            <View style={{ marginBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Zap size={16} color="#D4AF37" fill="#D4AF37" />
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginLeft: 10 }}>Tus Beneficios Activos</Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 'bold' }}>{benefits.filter(b => !b.isLocked).length} DISPONIBLES</Text>
              </View>

              {loading && benefits.length === 0 ? (
                <ActivityIndicator color="#D4AF37" style={{ marginTop: 20 }} />
              ) : benefits.filter(b => !b.isLocked).length === 0 ? (
                <View style={{ padding: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                  <Lock size={24} color="rgba(255,255,255,0.1)" />
                  <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', marginTop: 12 }}>Aún no tienes beneficios en este nivel</Text>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {benefits.filter(b => !b.isLocked).map((benefit: any) => (
                    <View key={benefit.id} style={{ backgroundColor: '#111', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={{ padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1, marginRight: 16 }}>
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 4 }}>{benefit.title}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', lineHeight: 14 }}>{benefit.description || 'Disfruta de este beneficio exclusivo por ser socio Boston.'}</Text>
                          </View>
                          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={20} color="#D4AF37" />
                          </View>
                        </View>

                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16, borderStyle: 'dashed', borderRadius: 1 }} />

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <RefreshCcw size={10} color="rgba(255,255,255,0.3)" />
                            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginLeft: 6, letterSpacing: 0.5 }}>
                              {benefit.redemptionPolicy === 'ONCE_TOTAL' ? 'Un solo uso' : benefit.redemptionPolicy === 'ONCE_PER_NIGHT' ? '1 vez por noche' : 'Uso ilimitado'}
                            </Text>
                          </View>
                          
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleRedeem(benefit)}
                            disabled={redeemingId === benefit.id}
                            style={{ backgroundColor: '#D4AF37', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}
                          >
                            {redeemingId === benefit.id ? (
                              <ActivityIndicator size="small" color="black" />
                            ) : (
                              <>
                                <Text style={{ color: 'black', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', marginRight: 6 }}>Canjear</Text>
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

            {/* Incentive Section */}
            {nextTier && (
              <View style={{ marginBottom: 40 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <Lock size={16} color="#FF3B30" />
                  <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginLeft: 10 }}>Próximos Desbloqueos: {nextTier.name}</Text>
                </View>
                
                <View style={{ backgroundColor: '#0f0f0f', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,59,48,0.1)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 }}>Beneficios de Nivel {nextTier.name}:</Text>
                  
                  <View style={{ gap: 14 }}>
                      {benefits.filter(b => b.level === nextTier.name).length > 0 ? (
                        benefits.filter(b => b.level === nextTier.name).slice(0, 3).map((benefit: any) => (
                          <View key={benefit.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,59,48,0.3)', marginRight: 12 }} />
                            <Text style={{ flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600', fontStyle: 'italic' }}>{benefit.title}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontStyle: 'italic' }}>Explora beneficios exclusivos al subir de rango.</Text>
                      )}
                  </View>

                  <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,59,48,0.05)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,59,48,0.1)' }}>
                    <View>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 }}>Te faltan</Text>
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{(nextTier.pointsNeeded - user.points).toLocaleString()} <Text style={{ fontSize: 10, color: '#FF3B30' }}>PTS</Text></Text>
                    </View>
                    <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                       <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>Siguiente Nivel</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Future Tiers List */}
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Hoja de Ruta VIP</Text>
              <View style={{ gap: 12 }}>
                {[
                  { name: "ORO", pts: settings?.goldThreshold || 5000, color: '#D4AF37' },
                  { name: "PLATINO", pts: settings?.platinumThreshold || 20000, color: '#E5E4E2' },
                  { name: "DIAMANTE", pts: settings?.diamondThreshold || 50000, color: '#22D3EE' },
                  { name: "SÚPER VIP", pts: settings?.superVipThreshold || 100000, color: '#FF3B30' },
                ].filter(t => {
                  const tiers = ['BRONCE', 'ORO', 'PLATINO', 'DIAMANTE', 'SÚPER VIP'];
                  return tiers.indexOf(t.name) > tiers.indexOf(user.membershipLevel);
                }).map((tier, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                        <Star size={16} color={tier.color} fill={tier.color + '20'} />
                      </View>
                      <View>
                        <Text style={{ color: tier.color, fontWeight: '900', fontSize: 15, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5 }}>{tier.name}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '700' }}>META: {tier.pts.toLocaleString()} PUNTOS</Text>
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
};
