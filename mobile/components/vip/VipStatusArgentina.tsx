import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { X, Trophy, Star, ArrowRight, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VipStatusProps } from './types';

const CELESTE = '#75AADB';
const GOLD    = '#F0C040';
const NAVY    = '#020B1A';

export default function VipStatusArgentina(props: VipStatusProps) {
  const { isVisible, onClose, user, settings, benefits, loading, redeemingId, handleRedeem, fetchBenefits, theme, nextTier } = props;

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View style={{ width: '100%', backgroundColor: NAVY, borderTopLeftRadius: 44, borderTopRightRadius: 44, borderTopWidth: 2, borderColor: `${CELESTE}33`, height: '94%', overflow: 'hidden' }}>

          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 4, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
            <View style={{ width: 48, height: 5, borderRadius: 3, backgroundColor: `${CELESTE}44` }} />
          </View>

          {/* Hero Header */}
          <View style={{ height: 250, position: 'relative' }}>
            <LinearGradient
              colors={[`${CELESTE}22`, `${CELESTE}0A`, NAVY]}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 999, backgroundColor: CELESTE, opacity: 0.07 }} />

            <View style={{ padding: 36, flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                onPress={onClose}
                style={{ position: 'absolute', top: 36, right: 24, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>

              {/* 3 stars + badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                <Star size={10} color={GOLD} fill={GOLD} />
                <Star size={10} color={GOLD} fill={GOLD} />
                <Star size={10} color={GOLD} fill={GOLD} />
                <View style={{ backgroundColor: `${CELESTE}22`, borderWidth: 1, borderColor: `${CELESTE}44`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 }}>
                  <Text style={{ color: CELESTE, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
                    Jerarquía Selección
                  </Text>
                </View>
              </View>

              <Text style={{ color: '#fff', fontSize: 56, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 54 }}>
                {user?.membershipLevel || 'AMATEUR'}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <Trophy size={16} color={CELESTE} />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, fontStyle: 'italic' }}>
                  {user?.points.toLocaleString()}
                  <Text style={{ color: CELESTE, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}> GLORIA</Text>
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 28, paddingBottom: 80 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBenefits} tintColor={CELESTE} />}
          >

            {/* Active benefits */}
            <View style={{ marginBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Zap size={18} color={CELESTE} fill={CELESTE} />
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 0.5 }}>
                    Beneficios Activos
                  </Text>
                </View>
                <View style={{ backgroundColor: `${CELESTE}14`, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: `${CELESTE}22` }}>
                  <Text style={{ color: CELESTE, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    {benefits.filter(b => !b.isLocked).length} activos
                  </Text>
                </View>
              </View>

              {loading && benefits.length === 0 ? (
                <ActivityIndicator color={CELESTE} style={{ marginTop: 40 }} />
              ) : benefits.filter(b => !b.isLocked).length === 0 ? (
                <View style={{ padding: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                  <Text style={{ fontSize: 32, marginBottom: 12 }}>🏟️</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 2 }}>
                    Aún sin beneficios en este rango
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  {benefits.filter(b => !b.isLocked).map((benefit: any) => (
                    <View
                      key={benefit.id}
                      style={{ backgroundColor: '#060D18', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: `${CELESTE}1A` }}
                    >
                      <LinearGradient colors={[`${CELESTE}0A`, 'transparent']} style={{ padding: 22 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1, marginRight: 16 }}>
                            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -0.3, marginBottom: 6 }}>
                              {benefit.title}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 16 }}>
                              {benefit.description || 'Beneficio exclusivo por tu lealtad a Boston Club.'}
                            </Text>
                          </View>
                          <View style={{ backgroundColor: `${CELESTE}14`, width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${CELESTE}22` }}>
                            <Trophy size={22} color={CELESTE} />
                          </View>
                        </View>

                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 18 }} />

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                            {benefit.redemptionPolicy === 'ONCE_TOTAL' ? 'Un solo uso' : benefit.redemptionPolicy === 'ONCE_PER_NIGHT' ? '1 vez por noche' : 'Ilimitado'}
                          </Text>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleRedeem(benefit)}
                            disabled={redeemingId === benefit.id}
                            style={{ backgroundColor: CELESTE, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                          >
                            {redeemingId === benefit.id ? (
                              <ActivityIndicator size="small" color="#000" />
                            ) : (
                              <>
                                <Text style={{ color: '#000', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, fontStyle: 'italic' }}>Usar</Text>
                                <Zap size={13} color="#000" fill="#000" />
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

            {/* Next tier */}
            {nextTier && (
              <View style={{ marginBottom: 40 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Star size={18} color="rgba(255,255,255,0.2)" />
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 0.5 }}>
                    Próximo Rango: {nextTier.name}
                  </Text>
                </View>

                <View style={{ backgroundColor: '#060D18', borderRadius: 32, padding: 28, borderWidth: 1.5, borderColor: `${CELESTE}22` }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
                    Beneficios de {nextTier.name}:
                  </Text>
                  <View style={{ gap: 12 }}>
                    {benefits.filter(b => b.level === nextTier.name).length > 0
                      ? benefits.filter(b => b.level === nextTier.name).slice(0, 3).map((b: any) => (
                          <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: CELESTE, opacity: 0.5 }} />
                            <Text style={{ flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 14, fontStyle: 'italic' }}>{b.title}</Text>
                          </View>
                        ))
                      : <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontStyle: 'italic' }}>Beneficios exclusivos al ascender de rango.</Text>
                    }
                  </View>

                  <View style={{ marginTop: 24, backgroundColor: `${CELESTE}0D`, borderWidth: 1, borderColor: `${CELESTE}22`, borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                        Gloria que te falta
                      </Text>
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20, fontStyle: 'italic', letterSpacing: -0.5 }}>
                        {(nextTier.pointsNeeded - user.points).toLocaleString()}
                        <Text style={{ color: CELESTE, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}> pts</Text>
                      </Text>
                    </View>
                    <View style={{ backgroundColor: CELESTE, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}>
                      <Text style={{ color: '#000', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Ascender</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* All tiers */}
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.1)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center', marginBottom: 20 }}>
                Escalafón de la Selección
              </Text>
              <View style={{ gap: 10 }}>
                {[
                  { name: 'ORO',       pts: settings?.goldThreshold || 5000,    color: '#D4AF37' },
                  { name: 'PLATINO',   pts: settings?.platinumThreshold || 20000, color: '#E5E4E2' },
                  { name: 'DIAMANTE',  pts: settings?.diamondThreshold || 50000,  color: CELESTE   },
                  { name: 'SÚPER VIP', pts: settings?.superVipThreshold || 100000, color: GOLD     },
                ].filter(t => {
                  const tiers = ['BRONCE', 'ORO', 'PLATINO', 'DIAMANTE', 'SÚPER VIP'];
                  return tiers.indexOf(t.name) > tiers.indexOf(user.membershipLevel);
                }).map((tier, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                        <Star size={18} color={tier.color} fill={tier.color} />
                      </View>
                      <View>
                        <Text style={{ color: tier.color, fontWeight: '900', fontSize: 16, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.3 }}>{tier.name}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>
                          META: {tier.pts.toLocaleString()} PTS
                        </Text>
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
