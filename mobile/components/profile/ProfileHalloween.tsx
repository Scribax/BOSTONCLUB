import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Share, ScrollView, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { LogOut, User, ShieldAlert, Mail, Edit2, X, Check, Users, Share2, Flame, Fingerprint, Crown, ChevronRight, RefreshCcw, Skull, Ghost, Moon, EyeOff } from 'lucide-react-native';
import api, { logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { VipStatusModal } from '../../components/VipStatusModal';
import QRCode from 'react-native-qrcode-svg';
import { QrCode as QrIcon } from 'lucide-react-native';
import { ProfileProps } from './types';
import { useTheme } from '../../contexts/ThemeContext';

const AVATARS = [
  { id: 'default', name: 'Original', icon: null },
  { id: 'A1', name: 'Avatar 1' },
  { id: 'A2', name: 'Avatar 2' },
  { id: 'A3', name: 'Avatar 3' },
  { id: 'A4', name: 'Avatar 4' },
  { id: 'A5', name: 'Avatar 5' },
  { id: 'A6', name: 'Avatar 6' },
];

export default function ProfileHalloween({ 
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
      Alert.alert('Error', 'El hechizo está incompleto.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch('/auth/me', { whatsapp: newWhatsapp });
      setUser(response.data);
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Maldición', err.response?.data?.message || 'Error al reescribir el pacto.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBiometrics = async () => {
    const newVal = !biometricsEnabled;
    if (newVal) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Entrega tu sello de sangre para activar el acceso.',
        fallbackLabel: 'Usar conjuro'
      });
      if (!result.success) return;
      setBiometricsEnabled(true);
      await SecureStore.setItemAsync('biometrics_enabled', 'true');
    } else {
      Alert.alert(
        'Romper Sello',
        '¿Deseas quitar la protección oscura? El panteón quedará vulnerable.',
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

  const handleLogout = async () => {
    Alert.alert(
      'Escapar del Inframundo', '¿Estás seguro que deseas abandonar el aquelarre?',
      [
        { text: 'Quedarme', style: 'cancel' },
        {
          text: 'Huir', style: 'destructive',
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
        message: `¡Únete a la secta! Usa mi sello ${user.referralCode} al invocar tu cuenta y ambos absorberemos almas (${user.referralRewardReferrer || 500} para mí y ${user.referralRewardReferee || 200} para ti). Entra al portal: https://mybostonclub.com`,
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
      Alert.alert('Maldición', 'Tu nueva forma fue rechazada.');
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

  const getLevelInfo = () => {
    switch (user?.membershipLevel) {
      case 'ORO': return { color: '#D4AF37', label: 'Brujo Mayor', aura: 'bg-[#D4AF37]' };
      case 'PLATINO': return { color: '#E5E4E2', label: 'Líder Sectario', aura: 'bg-white' };
      case 'DIAMANTE': return { color: '#00F5FF', label: 'Señor Oscuro', aura: 'bg-cyan-400' };
      case 'SÚPER VIP': return { color: theme.primary, label: 'Demonio Supremo', aura: `bg-[${theme.primary}]` };
      default: return { color: theme.primary, label: 'Cultista Novato', aura: `bg-[${theme.primary}]` };
    }
  };

  const level = getLevelInfo();

  return (
    <View className="flex-1 bg-[#0a050f]">
      <StatusBar style="light" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="relative min-h-[420px] pb-12 items-center justify-center pt-12">
          {/* Animated Background Aura */}
          <View className={`absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-[120px] bg-[${theme.primary}]`} style={{ backgroundColor: theme.primary }} />
          <View className="absolute top-20 left-10 w-40 h-40 rounded-full opacity-10 blur-[80px]" style={{ backgroundColor: theme.primary }} />

          <LinearGradient
            colors={['transparent', '#0a050f']}
            className="absolute inset-0 z-0"
          />

          <View className="z-10 items-center">
            {/* Avatar with Ring */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setAvatarModalVisible(true)}
              className="relative"
            >
              <View className="w-32 h-32 rounded-full items-center justify-center border-2 border-white/10 p-1.5 shadow-2xl">
                <View className={`w-full h-full rounded-full items-center justify-center bg-[#0d0714] border border-white/5 overflow-hidden`}>
                  {user.avatarId && user.avatarId !== 'default' ? (
                    <Image
                      source={user.avatarId.startsWith('http') ? { uri: user.avatarId } : getAvatarSource(user.avatarId)}
                      className="w-full h-full opacity-80"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ghost size={60} color={theme.primary} />
                  )}
                </View>
                <View className="absolute top-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2 border-black" style={{ backgroundColor: theme.primary }}>
                  <Edit2 size={14} color="black" />
                </View>
              </View>
              <View className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl items-center justify-center border border-white/10 shadow-lg`} style={{ backgroundColor: theme.primary }}>
                <Skull size={20} color="black" />
              </View>
            </TouchableOpacity>

            <View className="mt-6 items-center">
              <Text className="text-white text-3xl font-black italic uppercase tracking-tighter shadow-lg text-shadow">
                {user.firstName} <Text style={{ color: theme.primary }}>{user.lastName}</Text>
              </Text>
              {/* Tappable Level Badge */}
              <TouchableOpacity activeOpacity={0.8} onPress={handleOpenBenefits} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: `${theme.primary}4D` }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 8, backgroundColor: theme.primary }} />
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>{level.label}</Text>
                  <Moon size={12} color={theme.primary} style={{ marginLeft: 8 }} />
                  <ChevronRight size={12} color="rgba(255,255,255,0.3)" style={{ marginLeft: 4 }} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginTop: 4 }}>Toca para ver pactos oscuros</Text>
              </TouchableOpacity>

              {/* Digital Membership Card Button */}
              <TouchableOpacity 
                onPress={() => setShowMemberQr(true)}
                activeOpacity={0.8}
                style={{ borderColor: `${theme.primary}4D`, backgroundColor: `${theme.primary}1A` }}
                className="mt-8 px-10 py-4 rounded-[2rem] flex-row items-center shadow-lg"
              >
                <QrIcon size={20} color={theme.primary} className="mr-3" />
                <Text style={{ color: theme.primary }} className="font-black uppercase text-[10px] tracking-widest">Sello Digital</Text>
              </TouchableOpacity>
            </View>

            {/* Main Stats Bar */}
            <View className="flex-row items-center mt-10 bg-[#0d0714] border rounded-[2rem] p-5 w-[90%] shadow-2xl" style={{ borderColor: `${theme.primary}33` }}>
              <View className="flex-1 items-center border-r" style={{ borderColor: `${theme.primary}20` }}>
                <Text style={{ color: theme.primary }} className="text-xl font-black italic">{user.points || 0}</Text>
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1">Almas</Text>
                {isHappyHour && <Text style={{ color: theme.primary }} className="font-black text-[7px] uppercase mt-1">⚡ x2 ACTIVO</Text>}
              </View>
              <View className="flex-1 items-center border-r" style={{ borderColor: `${theme.primary}20` }}>
                <View className="flex-row items-center">
                  <Flame size={16} color={theme.primary} className="mr-1" />
                  <Text style={{ color: theme.primary }} className="text-xl font-black italic">{user.streak || 0}</Text>
                </View>
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1">Invocaciones</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-white text-xl font-black italic">#{user.id.slice(-4).toUpperCase()}</Text>
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1">Nº Cultista</Text>
              </View>
            </View>

          </View>
        </View>

        {/* Content Section */}
        <View className="px-6 -mt-6 pb-36">

          {/* Referral Premium Card */}
          {isEnabled('enable_referrals') && (
            <View className="relative mb-8 overflow-hidden rounded-[2.5rem] border shadow-2xl" style={{ borderColor: `${theme.primary}4D` }}>
              <LinearGradient
                colors={[`${theme.primary}4D`, '#0d0714']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
              <View className="p-8">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="p-2.5 rounded-2xl mr-4" style={{ backgroundColor: `${theme.primary}33` }}>
                      <Skull size={24} color={theme.primary} />
                    </View>
                    <View>
                      <Text style={{ color: theme.primary }} className="font-black text-xs uppercase tracking-[0.2em]">Invocar Discípulos</Text>
                      <Text className="text-white/40 text-[9px] font-bold uppercase mt-0.5">Recluta almas para el aquelarre</Text>
                    </View>
                  </View>
                </View>

                <View className="bg-black/60 rounded-[1.5rem] p-5 border flex-row items-center justify-between shadow-inner" style={{ borderColor: `${theme.primary}33` }}>
                  <View>
                    <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Tu Sello de Invocación</Text>
                    <Text className="text-white text-2xl font-black tracking-[0.3em]">{user.referralCode}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleShareReferral}
                    style={{ backgroundColor: theme.primary }}
                    className="h-12 w-12 rounded-2xl items-center justify-center shadow-lg"
                  >
                    <Share2 size={20} color="black" />
                  </TouchableOpacity>
                </View>

                <View className="mt-5 flex-row items-center">
                  <View className="h-[4px] w-[4px] rounded-full mr-3" style={{ backgroundColor: theme.primary }} />
                  <Text className="text-white/60 text-[9px] font-bold uppercase leading-4 flex-1">
                    Tú absorbes <Text style={{ color: theme.primary }}>{user.referralRewardReferrer || 500} almas</Text> y tu discípulo <Text style={{ color: theme.primary }}>{user.referralRewardReferee || 200} almas</Text>
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Settings Groups */}
          <Text className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] mb-4 ml-4">El Registro de Almas</Text>

          <View className="bg-[#0d0714] border rounded-[2.5rem] overflow-hidden mb-8" style={{ borderColor: `${theme.primary}33` }}>
            <View className="p-6 flex-row items-center border-b opacity-50" style={{ borderBottomColor: `${theme.primary}20` }}>
              <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                <Ghost size={18} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Nombre Terrenal (Protegido)</Text>
                <Text className="text-white text-sm font-medium italic">{user.firstName} {user.lastName}</Text>
              </View>
            </View>

            <View className="p-6 flex-row items-center border-b" style={{ borderBottomColor: `${theme.primary}20` }}>
              <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                <Mail size={18} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Contacto Espiritual</Text>
                <Text className="text-white text-sm font-medium" numberOfLines={1}>{user.email}</Text>
              </View>
            </View>

            <View className="p-6 flex-row items-center border-b" style={{ borderBottomColor: `${theme.primary}20` }}>
              <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                <ShieldAlert size={18} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Identidad Mortal</Text>
                <Text className="text-white text-sm font-medium">{user.dni || 'Desconocido'}</Text>
              </View>
            </View>

            <View className="p-6 flex-row items-center">
              <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                <Flame size={18} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Línea de Invocación</Text>
                <Text className="text-white text-sm font-medium">{user.whatsapp || 'Desconocido'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(true)}
                className="bg-white/5 p-3 rounded-xl border border-white/10"
              >
                <Edit2 size={14} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Group */}
          <Text className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] mb-4 ml-4">Protección Oscura</Text>
          <View className="bg-[#0d0714] border rounded-[2.5rem] overflow-hidden" style={{ borderColor: `${theme.primary}33` }}>
            {isBiometricSupported && (
              <View className="p-6 flex-row items-center">
                <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                  <EyeOff size={18} color={biometricsEnabled ? theme.primary : "rgba(255,255,255,0.6)"} />
                </View>
                <View className="flex-1">
                  <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Sello de Sangre</Text>
                  <Text className="text-white text-sm font-medium">Restricción Biométrica</Text>
                </View>
                <TouchableOpacity
                  onPress={handleToggleBiometrics}
                  className={`w-12 h-6 rounded-full items-center flex-row px-1`}
                  style={{ backgroundColor: biometricsEnabled ? theme.primary : 'rgba(255,255,255,0.1)' }}
                >
                  <View className={`w-4 h-4 rounded-full ${biometricsEnabled ? 'bg-black ml-auto' : 'bg-white/40'}`} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Logout */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            className="mt-12 border rounded-[2rem] py-6 items-center flex-row justify-center shadow-xl"
            style={{ backgroundColor: 'rgba(255,59,48,0.1)', borderColor: 'rgba(255,59,48,0.3)', shadowColor: 'red' }}
          >
            <LogOut size={18} color="#ff4d4d" className="mr-4" />
            <Text className="text-[#ff4d4d] font-black text-[10px] uppercase tracking-[0.3em]">Escapar del Inframundo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal Spooky */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/95 justify-center p-6">
          <View className="w-full bg-[#0d0714] border rounded-[3.5rem] p-8 relative overflow-hidden shadow-2xl" style={{ borderColor: `${theme.primary}4D` }}>
            <View className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 blur-[80px]" style={{ backgroundColor: theme.primary }} />

            <View className="flex-row justify-between items-start mb-10">
              <View>
                <Text className="text-2xl font-black text-white italic uppercase tracking-tighter">Reescribir Pacto</Text>
                <Text className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">Línea de Invocación</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-3 bg-white/5 rounded-full border border-white/10">
                <X size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View className="flex-col gap-6">
              <View>
                <Text className="text-[10px] font-bold uppercase mb-3 ml-2 tracking-widest" style={{ color: theme.primary }}>Número (Sin guiones)</Text>
                <TextInput
                  value={newWhatsapp}
                  onChangeText={(t) => setNewWhatsapp(t.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  placeholder="11 2233 4455"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  className="w-full bg-black/50 text-white border rounded-2xl py-5 px-6 text-lg font-black tracking-[0.1em]"
                  style={{ borderColor: `${theme.primary}33` }}
                />
              </View>

              <TouchableOpacity
                onPress={handleSavePhone}
                disabled={saving}
                style={{ opacity: saving ? 0.5 : 1, backgroundColor: theme.primary }}
                className="w-full rounded-2xl py-5 items-center shadow-xl"
              >
                {saving ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-black uppercase text-xs tracking-[0.3em]">Sellar Pacto</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Modal */}
      <Modal visible={avatarModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
          <View 
            className="bg-[#0d0714] border-t rounded-t-[3rem] p-8"
            style={{ maxHeight: '85%', borderColor: `${theme.primary}4D` }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-black text-white italic uppercase tracking-tighter">Elige tu Forma</Text>
                <Text className="text-[10px] font-black uppercase tracking-[0.2em] mt-1" style={{ color: theme.primary }}>Reencarnación Boston</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setAvatarModalVisible(false)} 
                className="p-3 bg-white/5 rounded-full border border-white/10"
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                justifyContent: 'space-between',
                paddingBottom: 40 
              }}
            >
              {[...AVATARS, ...customAvatars.map(a => ({ id: a.url, name: a.name || 'Espectro' }))].map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  onPress={() => handleSelectAvatar(avatar.id)}
                  disabled={updatingAvatar}
                  className={`w-[47%] mb-6 rounded-3xl overflow-hidden border-2 bg-black p-2`}
                  style={{ borderColor: user.avatarId === avatar.id ? theme.primary : 'rgba(255,255,255,0.05)' }}
                >
                  <View className="aspect-square w-full rounded-2xl bg-white/5 items-center justify-center overflow-hidden mb-2">
                    {avatar.id === 'default' ? (
                      <Ghost size={40} color={level.color} />
                    ) : (
                      <Image 
                        source={avatar.id.startsWith('http') ? { uri: avatar.id } : getAvatarSource(avatar.id)} 
                        className="w-full h-full opacity-80" 
                        resizeMode="cover" 
                      />
                    )}
                  </View>
                  <Text className={`text-center font-bold text-[10px] uppercase tracking-widest`} style={{ color: user.avatarId === avatar.id ? theme.primary : 'rgba(255,255,255,0.4)' }}>
                    {avatar.name}
                  </Text>
                  {user.avatarId === avatar.id && (
                    <View className="absolute top-2 right-2 rounded-full p-1" style={{ backgroundColor: theme.primary }}>
                      <Check size={10} color="black" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {updatingAvatar && (
              <View className="absolute inset-0 bg-black/60 items-center justify-center rounded-t-[3rem]">
                <ActivityIndicator color={theme.primary} size="large" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Membership QR Modal - Spooky */}
      <Modal visible={showMemberQr} transparent animationType="fade">
        <View className="flex-1 bg-black/95 justify-center items-center p-6">
          <View className="w-full bg-[#0d0714] border rounded-[3.5rem] p-10 items-center relative overflow-hidden" style={{ borderColor: `${theme.primary}66` }}>
            <View className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-[100px]" style={{ backgroundColor: theme.primary }} />
            
            <TouchableOpacity 
              onPress={() => setShowMemberQr(false)} 
              className="absolute top-8 right-8 p-3 bg-white/5 rounded-full border border-white/10"
            >
              <X size={20} color="white" />
            </TouchableOpacity>

            <View className="items-center mb-10">
               <Text className="text-2xl font-black text-white italic uppercase tracking-tighter">Sello de Sangre</Text>
               <Text className="text-[10px] font-black uppercase tracking-[0.2em] mt-2" style={{ color: theme.primary }}>{level.label}</Text>
            </View>

            <View className="bg-white/90 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              {memberToken ? (
                <>
                  <QRCode
                    value={memberToken}
                    size={200}
                    color="black"
                    backgroundColor="transparent"
                  />
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: 'transparent' }}>
                    <Animated.View 
                      style={{ 
                        height: '100%', 
                        backgroundColor: theme.primary,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        })
                      }} 
                    />
                  </View>
                </>
              ) : (
                <View style={{ width: 200, height: 200 }} className="items-center justify-center">
                  <ActivityIndicator color={theme.primary} />
                </View>
              )}
            </View>

            <View className="mt-10 items-center">
               <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest text-center leading-5">
                 Presenta este sello ante los guardianes{"\n"}para que cosechen tus almas
               </Text>
               <View className="mt-8 flex-row items-center bg-white/5 px-5 py-3 rounded-2xl border border-white/10">
                 <RefreshCcw size={14} color={theme.primary} className="mr-3" />
                 <Text className="text-white/60 text-[9px] font-bold uppercase tracking-[0.2em]">Magia renueva en 15s</Text>
               </View>
            </View>
          </View>
        </View>
      </Modal>

      <VipStatusModal
        isVisible={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        user={user}
        settings={settings}
        onRedeemSuccess={handleRedeemBenefit}
      />
    </View>
  );
}
