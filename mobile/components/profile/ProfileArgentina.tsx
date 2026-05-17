import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Share, ScrollView, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { LogOut, ShieldAlert, Mail, Edit2, X, Check, Share2, Zap, Trophy, Star, ChevronRight, RefreshCcw, EyeOff, QrCode as QrIcon, Ticket } from 'lucide-react-native';
import api, { logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { VipStatusModal } from '../../components/VipStatusModal';
import QRCode from 'react-native-qrcode-svg';
import { ProfileProps } from './types';
import { useTheme } from '../../contexts/ThemeContext';

const CELESTE = '#75AADB';
const GOLD    = '#F0C040';
const NAVY    = '#020B1A';

const AVATARS = [
  { id: 'default', name: 'Original', icon: null },
  { id: 'A1', name: 'Messi Style' },
  { id: 'A2', name: 'Capitán' },
  { id: 'A3', name: 'Arquero' },
  { id: 'A4', name: 'Hinchada' },
  { id: 'A5', name: 'Gloria' },
  { id: 'A6', name: 'Potrero' },
];

export default function ProfileArgentina({ 
  user, setUser, settings, customAvatars, 
  isBiometricSupported, biometricsEnabled, setBiometricsEnabled, 
  theme, isEnabled 
}: ProfileProps) {
  const { isHappyHour } = useTheme();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newWhatsapp, setNewWhatsapp] = useState(user.whatsapp || '');
  const [saving, setSaving] = useState(false);
  
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  
  const [showMemberQr, setShowMemberQr] = useState(false);
  const [memberToken, setMemberToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);

  const progressAnim = useRef(new Animated.Value(1)).current;

  const handleOpenBenefits = () => setShowBenefitsModal(true);

  const handleRedeemBenefit = (token: string, reward: string) => {
    router.push({ pathname: '/reward-qr', params: { token, reward } });
  };

  const handleSavePhone = async () => {
    if (!newWhatsapp || newWhatsapp.trim() === '') {
      Alert.alert('Error', 'El número no puede estar vacío.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch('/auth/me', { whatsapp: newWhatsapp });
      setUser(response.data);
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error al actualizar el teléfono.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBiometrics = async () => {
    const newVal = !biometricsEnabled;
    if (newVal) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirmá tu identidad para activar el acceso biométrico.',
        fallbackLabel: 'Usar código'
      });
      if (!result.success) return;
      setBiometricsEnabled(true);
      await SecureStore.setItemAsync('biometrics_enabled', 'true');
    } else {
      Alert.alert(
        'Desactivar Biometría',
        '¿Deseas quitar la protección biométrica?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar', style: 'destructive',
            onPress: async () => {
              setBiometricsEnabled(false);
              await SecureStore.setItemAsync('biometrics_enabled', 'false');
            }
          }
        ]
      );
    }
  };

  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchRedemptionHistory = async () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const res = await api.get('/redemptions/my-history');
      setRedemptionHistory(res.data);
    } catch (err) {
      console.error('Error fetching redemption history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión', '¿Estás seguro que deseas salir del vestuario?',
      [
        { text: 'Quedarme', style: 'cancel' },
        {
          text: 'Salir', style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleShareReferral = async () => {
    try {
      await Share.share({
        message: `¡Sumate a la Scaloneta! Usá mi código ${user.referralCode} al registrarte y ambos sumamos gloria (${user.referralRewardReferrer || 500} para mí y ${user.referralRewardReferee || 200} para vos). Entrá acá: https://mybostonclub.com`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    setUpdatingAvatar(true);
    try {
      await api.patch('/auth/avatar', { avatarId });
      setUser({ ...user, avatarId });
      setAvatarModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo actualizar tu ficha de jugador.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const fetchMemberToken = async () => {
    try {
      const res = await api.get('/member-qr/token');
      setMemberToken(res.data.token);
      setTokenExpiry(res.data.expiresAt);
      
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0, duration: 15000, useNativeDriver: false,
      }).start();
    } catch (err) {
      console.error("Error fetching member token", err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (showMemberQr) {
      fetchMemberToken();
      interval = setInterval(fetchMemberToken, 15000);
    }
    return () => {
      clearInterval(interval);
      progressAnim.setValue(1);
    };
  }, [showMemberQr]);

  const getAvatarSource = (id: string) => {
    switch (id) {
      case 'A1': return require('../../assets/images/avatars/A1.png');
      case 'A2': return require('../../assets/images/avatars/A2.png');
      case 'A3': return require('../../assets/images/avatars/A3.png');
      case 'A4': return require('../../assets/images/avatars/A4.png');
      case 'A5': return require('../../assets/images/avatars/A5.png');
      case 'A6': return require('../../assets/images/avatars/A6.png');
      default: return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>
      <StatusBar style="light" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={{ minHeight: 400, paddingTop: 60, alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: CELESTE, opacity: 0.1, filter: 'blur(80px)' }} />
          
          {/* Avatar with Ring */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setAvatarModalVisible(true)}
            style={{ position: 'relative' }}
          >
            <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: `${CELESTE}44`, padding: 4, shadowColor: CELESTE, shadowOpacity: 0.3, shadowRadius: 20 }}>
              <View style={{ flex: 1, borderRadius: 66, backgroundColor: '#060D18', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                {user.avatarId && user.avatarId !== 'default' ? (
                  <Image
                    source={user.avatarId.startsWith('http') ? { uri: user.avatarId } : getAvatarSource(user.avatarId)}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 60 }}>🇦🇷</Text>
                )}
              </View>
              <View style={{ position: 'absolute', bottom: 5, right: 5, width: 36, height: 36, borderRadius: 18, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: NAVY }}>
                <Edit2 size={16} color="black" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 32, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1 }}>
              {user.firstName} <Text style={{ color: CELESTE }}>{user.lastName}</Text>
            </Text>
            
            <TouchableOpacity activeOpacity={0.8} onPress={handleOpenBenefits} style={{ marginTop: 12 }}>
              <LinearGradient
                colors={[`${CELESTE}22`, `${CELESTE}11`]}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: `${CELESTE}44` }}
              >
                <Trophy size={14} color={GOLD} style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>{user.membershipLevel || 'AMATEUR'}</Text>
                <ChevronRight size={14} color={CELESTE} style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowMemberQr(true)}
              activeOpacity={0.8}
              style={{ marginTop: 24, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24, backgroundColor: `${CELESTE}11`, borderWidth: 1, borderColor: `${CELESTE}33`, flexDirection: 'row', alignItems: 'center' }}
            >
              <QrIcon size={20} color={CELESTE} style={{ marginRight: 12 }} />
              <Text style={{ color: CELESTE, fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 2 }}>Ficha Digital</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={{ flexDirection: 'row', marginTop: 40, backgroundColor: '#060D18', borderRadius: 32, padding: 24, width: '90%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 }}>
            <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' }}>
              <Text style={{ color: CELESTE, fontSize: 22, fontWeight: '900', fontStyle: 'italic' }}>{user.points || 0}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>Gloria</Text>
              {isHappyHour && <Text style={{ color: CELESTE, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 }}>⚡ x2 ACTIVO</Text>}
            </View>
            <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Zap size={16} color={GOLD} style={{ marginRight: 4 }} />
                <Text style={{ color: GOLD, fontSize: 22, fontWeight: '900', fontStyle: 'italic' }}>{user.streak || 0}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>Racha</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', fontStyle: 'italic' }}>#{user.id.slice(-4).toUpperCase()}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>Dorsal</Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 140 }}>
          
          {/* Referral Card */}
          {isEnabled('enable_referrals') && (
            <View style={{ marginBottom: 32, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: `${CELESTE}44` }}>
              <LinearGradient colors={[`${CELESTE}11`, '#060D18']} style={{ padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ padding: 12, borderRadius: 16, backgroundColor: `${CELESTE}22`, marginRight: 16 }}>
                    <Star size={24} color={GOLD} fill={GOLD} />
                  </View>
                  <View>
                    <Text style={{ color: CELESTE, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>Traé Refuerzos</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>Sumá gloria invitando amigos</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: `${CELESTE}22`, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Tu Código de Invitación</Text>
                    <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: 4 }}>{user.referralCode}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleShareReferral}
                    style={{ backgroundColor: CELESTE, height: 56, width: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Share2 size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Info Cards */}
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16, marginLeft: 8 }}>Datos de la Ficha</Text>
          
          <View style={{ backgroundColor: '#060D18', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 32 }}>
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Mail size={20} color={CELESTE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Email</Text>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{user.email}</Text>
              </View>
            </View>

            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <ShieldAlert size={20} color={CELESTE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>DNI</Text>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{user.dni || 'No registrado'}</Text>
              </View>
            </View>

            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Zap size={20} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>WhatsApp</Text>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{user.whatsapp || 'No registrado'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(true)}
                style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <Edit2 size={16} color={CELESTE} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security */}
          {isBiometricSupported && (
            <>
              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16, marginLeft: 8 }}>Seguridad</Text>
              <View style={{ backgroundColor: '#060D18', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <EyeOff size={20} color={biometricsEnabled ? GOLD : 'rgba(255,255,255,0.4)'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Acceso Biométrico</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Usar huella o rostro para entrar</Text>
                </View>
                <TouchableOpacity
                  onPress={handleToggleBiometrics}
                  style={{ width: 50, height: 26, borderRadius: 13, backgroundColor: biometricsEnabled ? CELESTE : 'rgba(255,255,255,0.1)', paddingHorizontal: 3, justifyContent: 'center' }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', marginLeft: biometricsEnabled ? 'auto' : 0 }} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Redemption History */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { if (!showHistory) fetchRedemptionHistory(); setShowHistory(!showHistory); }}
            style={{ marginTop: 32, backgroundColor: 'rgba(0,126,51,0.05)', borderWidth: 1, borderColor: 'rgba(0,126,51,0.2)', borderRadius: 28, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: 'rgba(0,126,51,0.15)', borderWidth: 1, borderColor: 'rgba(0,126,51,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Ticket size={18} color="#00843D" />
              </View>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 2 }}>Historial</Text>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>Mis Canjes</Text>
              </View>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.3)" style={{ transform: [{ rotate: showHistory ? '90deg' : '0deg' }] }} />
          </TouchableOpacity>

          {showHistory && (
            <View style={{ marginTop: 8, backgroundColor: 'rgba(0,126,51,0.05)', borderWidth: 1, borderColor: 'rgba(0,126,51,0.15)', borderRadius: 28, overflow: 'hidden' }}>
              {loadingHistory ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color="#00843D" /></View>
              ) : redemptionHistory.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Trophy size={28} color="rgba(255,255,255,0.1)" />
                  <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginTop: 12 }}>Sin canjes registrados</Text>
                </View>
              ) : (
                redemptionHistory.map((item, index) => (
                  <View key={item.id} style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: index < redemptionHistory.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: item.status === 'COMPLETED' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ticket size={14} color={item.status === 'COMPLETED' ? '#22c55e' : 'rgba(255,255,255,0.3)'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{item.title}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{new Date(item.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {item.pointsCost ? <Text style={{ color: '#ff4d4d', fontSize: 12, fontWeight: '900' }}>-{item.pointsCost} pts</Text> : null}
                      <View style={{ marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: item.status === 'COMPLETED' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)' }}>
                        <Text style={{ color: item.status === 'COMPLETED' ? '#22c55e' : 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{item.status === 'COMPLETED' ? 'Canjeado' : 'Cancelado'}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            style={{ marginTop: 48, paddingVertical: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
          >
            <LogOut size={18} color="#EF4444" style={{ marginRight: 12 }} />
            <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Salir del Vestuario</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals are kept similar to Halloween but with theme colors */}
      <VipStatusModal
        isVisible={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        user={user}
        settings={settings}
        onRedeemSuccess={handleRedeemBenefit}
      />

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#060D18', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: `${CELESTE}44` }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic' }}>EDITAR TELÉFONO</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={newWhatsapp}
              onChangeText={setNewWhatsapp}
              keyboardType="numeric"
              placeholder="Número de WhatsApp"
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: `${CELESTE}22`, borderRadius: 16, padding: 20, color: 'white', fontSize: 18, marginBottom: 24 }}
            />
            <TouchableOpacity
              onPress={handleSavePhone}
              disabled={saving}
              style={{ backgroundColor: CELESTE, paddingVertical: 20, borderRadius: 20, alignItems: 'center' }}
            >
              {saving ? <ActivityIndicator color="black" /> : <Text style={{ color: 'black', fontWeight: '900' }}>GUARDAR CAMBIOS</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Avatar Modal */}
      <Modal visible={avatarModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#060D18', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', fontStyle: 'italic' }}>ELEGÍ TU AVATAR</Text>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {[...AVATARS, ...customAvatars.map(a => ({ id: a.url, name: a.name }))].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelectAvatar(item.id)}
                    style={{ width: '48%', marginBottom: 16, padding: 16, borderRadius: 20, borderWidth: 2, borderColor: user.avatarId === item.id ? CELESTE : 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center' }}
                  >
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.3)', marginBottom: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                      {item.id === 'default' ? <Text style={{ fontSize: 32 }}>🇦🇷</Text> : (
                        <Image source={item.id.startsWith('http') ? { uri: item.id } : getAvatarSource(item.id)} style={{ width: '100%', height: '100%' }} />
                      )}
                    </View>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Member QR Modal */}
      <Modal visible={showMemberQr} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#060D18', borderRadius: 40, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: `${CELESTE}44`, width: '100%' }}>
            <TouchableOpacity 
              onPress={() => setShowMemberQr(false)} 
              style={{ position: 'absolute', top: 24, right: 24, padding: 12 }}
            >
              <X size={24} color="white" />
            </TouchableOpacity>

            <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic', marginBottom: 8 }}>FICHA DE JUGADOR</Text>
            <Text style={{ color: CELESTE, fontSize: 10, fontWeight: '900', marginBottom: 32, letterSpacing: 4 }}>{user.membershipLevel || 'AMATEUR'}</Text>

            <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 32, shadowColor: CELESTE, shadowOpacity: 0.5, shadowRadius: 20 }}>
              {memberToken ? (
                <QRCode value={memberToken} size={220} />
              ) : (
                <ActivityIndicator color={CELESTE} size="large" style={{ width: 220, height: 220 }} />
              )}
            </View>

            <View style={{ marginTop: 32, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
                Mostrá este QR en caja para que{"\n"}te carguen tus puntos de gloria.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16 }}>
                <RefreshCcw size={14} color={CELESTE} style={{ marginRight: 8 }} />
                <Text style={{ color: CELESTE, fontSize: 9, fontWeight: '900' }}>SE ACTUALIZA CADA 15 SEG</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
