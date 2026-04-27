import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Share, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LogOut, User, ShieldCheck, Mail, Edit2, X, Phone, Check, Users, Share2, Flame } from 'lucide-react-native';
import api, { logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Fingerprint, MonitorCheck } from 'lucide-react-native';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Usamos useEffect para cargar datos al montar el componente
  useEffect(() => {
    fetchUser();
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    setIsBiometricSupported(compatible && isEnrolled);
    
    const storedPref = await SecureStore.getItemAsync('biometrics_enabled');
    setBiometricsEnabled(storedPref === 'true');
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setNewWhatsapp(response.data.whatsapp || '');
    } catch (err) {
      // Dejamos que el interceptor de api.ts o el RootLayout manejen la sesión expirada
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (!newWhatsapp || newWhatsapp.trim() === '') {
      Alert.alert('Error', 'El número no puede estar vacío');
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch('/auth/me', { whatsapp: newWhatsapp });
      setUser(response.data);
      setEditModalVisible(false);
      Alert.alert('Éxito', 'Número actualizado correctamente');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBiometrics = async () => {
    const newVal = !biometricsEnabled;
    
    if (newVal) {
      // Pedir verificación biométrica antes de ACTIVAR
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad para activar el acceso biométrico',
        fallbackLabel: 'Usar contraseña'
      });
      
      if (!result.success) return;

      setBiometricsEnabled(true);
      await SecureStore.setItemAsync('biometrics_enabled', 'true');
    } else {
      // Para DESACTIVAR, usar un Alert de confirmación (evita conflictos de hardware biométrico)
      Alert.alert(
        'Desactivar Biometría',
        '¿Querés desactivar el bloqueo biométrico? Tu sesión quedará sin protección adicional.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar',
            style: 'destructive',
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
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir del club?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, Salir', 
          style: 'destructive',
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
        message: `¡Sumate al Boston Club conmigo! Usá mi código ${user.referralCode} al registrarte y ganamos puntos los dos. Descargá la app acá: https://mybostonclub.com`,
      });
    } catch (error) {
      console.error(error);
    }
  };


  if (loading && !user) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  // FIX: Guard de seguridad — si user es null pero ya no estamos cargando
  // (fetchUser falló silenciosamente), no crasheamos, mostramos pantalla vacía
  if (!user) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <Text className="text-white/20 uppercase font-black tracking-widest text-[10px]">Sin datos de perfil</Text>
      </View>
    );
  }

  // Generate Aura color
  const getLevelInfo = () => {
    switch (user?.membershipLevel) {
      case 'ORO': return { color: '#D4AF37', label: 'Socio Oro', aura: 'bg-[#D4AF37]' };
      case 'PLATINO': return { color: '#E5E4E2', label: 'Socio Platino', aura: 'bg-white' };
      case 'DIAMANTE': return { color: '#00F5FF', label: 'Socio Diamante', aura: 'bg-cyan-400' };
      case 'SÚPER VIP': return { color: '#FF3B30', label: 'Socio Súper VIP', aura: 'bg-[#FF3B30]' };
      default: return { color: '#CC6633', label: 'Socio Bronce', aura: 'bg-[#CC6633]' };
    }
  };

  const level = getLevelInfo();

  if (loading || !user) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="relative h-[420px] items-center justify-center pt-12">
          {/* Animated Background Aura */}
          <View className={`absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-[120px] ${level.aura}`} />
          <View className="absolute top-20 left-10 w-40 h-40 bg-boston-red rounded-full opacity-10 blur-[80px]" />
          
          <LinearGradient
            colors={['transparent', '#050505']}
            className="absolute inset-0 z-0"
          />

          <View className="z-10 items-center">
            {/* Avatar with Ring */}
            <View className="relative">
               <View className="w-32 h-32 rounded-full items-center justify-center border-2 border-white/10 p-1.5 shadow-2xl">
                 <View className={`w-full h-full rounded-full items-center justify-center bg-[#111] border border-white/5 overflow-hidden`}>
                   <User size={60} color={level.color} />
                 </View>
               </View>
               <View className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl items-center justify-center border border-white/10 shadow-lg ${level.aura}`}>
                  <ShieldCheck size={20} color={user.membershipLevel === 'PLATINO' || user.membershipLevel === 'DIAMANTE' ? 'black' : 'white'} />
               </View>
            </View>

            <View className="mt-6 items-center">
              <Text className="text-white text-3xl font-black italic uppercase tracking-tighter shadow-lg">
                {user.firstName} <Text className="text-boston-gold">{user.lastName}</Text>
              </Text>
              <View className="flex-row items-center mt-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-xl">
                 <View className={`w-2 h-2 rounded-full mr-3 ${level.aura} animate-pulse`} />
                 <Text className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em]">{level.label}</Text>
              </View>
            </View>

            {/* Main Stats Bar */}
            <View className="flex-row items-center mt-10 bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 w-[90%] shadow-2xl">
              <View className="flex-1 items-center border-r border-white/5">
                <Text className="text-boston-gold text-xl font-black italic">{user.points || 0}</Text>
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1">Puntos Totales</Text>
              </View>
              <View className="flex-1 items-center border-r border-white/5">
                <View className="flex-row items-center">
                  <Flame size={16} color="#FF4D4D" className="mr-1" />
                  <Text className="text-[#FF4D4D] text-xl font-black italic">{user.streak || 0}</Text>
                </View>
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1">Semanas Racha</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-white text-xl font-black italic">#{user.id.slice(-4).toUpperCase()}</Text>
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1">ID Socio</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-6 -mt-6 pb-24">
          
          {/* Referral Premium Card */}
          <View className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-boston-gold/30 shadow-2xl shadow-boston-gold/10">
            <LinearGradient
              colors={['#D4AF37', '#8A6D3B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0 opacity-[0.08]"
            />
            <View className="p-8">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="bg-boston-gold/20 p-2.5 rounded-2xl mr-4">
                    <Users size={24} color="#D4AF37" />
                  </View>
                  <View>
                    <Text className="text-boston-gold font-black text-xs uppercase tracking-[0.2em]">Invitá Amigos</Text>
                    <Text className="text-white/40 text-[9px] font-bold uppercase mt-0.5">Ganá puntos por cada referido</Text>
                  </View>
                </View>
              </View>

              <View className="bg-black/40 rounded-[1.5rem] p-5 border border-white/5 flex-row items-center justify-between shadow-inner">
                <View>
                  <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Tu Código Único</Text>
                  <Text className="text-white text-2xl font-black tracking-[0.3em]">{user.referralCode}</Text>
                </View>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={handleShareReferral}
                  className="bg-boston-gold h-12 w-12 rounded-2xl items-center justify-center shadow-lg shadow-boston-gold/20"
                >
                  <Share2 size={20} color="black" />
                </TouchableOpacity>
              </View>
              
              <View className="mt-5 flex-row items-center">
                 <View className="h-[4px] w-[4px] rounded-full bg-boston-gold mr-3" />
                 <Text className="text-white/60 text-[9px] font-bold uppercase leading-4 flex-1">
                   Tú recibís <Text className="text-boston-gold">500 pts</Text> y tu amigo <Text className="text-boston-gold">200 pts</Text>
                 </Text>
              </View>
            </View>
          </View>

          {/* Settings Groups */}
          <Text className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] mb-4 ml-4">Información Personal</Text>
          
          <View className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden mb-8">
             <View className="p-6 flex-row items-center border-b border-white/5">
                <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                   <Mail size={18} color="rgba(255,255,255,0.6)" />
                </View>
                <View className="flex-1">
                   <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Email</Text>
                   <Text className="text-white text-sm font-medium" numberOfLines={1}>{user.email}</Text>
                </View>
             </View>

             <View className="p-6 flex-row items-center border-b border-white/5">
                <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                   <ShieldCheck size={18} color="rgba(255,255,255,0.6)" />
                </View>
                <View className="flex-1">
                   <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">DNI / Identidad</Text>
                   <Text className="text-white text-sm font-medium">{user.dni || 'No registrado'}</Text>
                </View>
             </View>

             <View className="p-6 flex-row items-center">
                <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                   <Phone size={18} color="rgba(255,255,255,0.6)" />
                </View>
                <View className="flex-1">
                   <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">WhatsApp</Text>
                   <Text className="text-white text-sm font-medium">{user.whatsapp || 'No registrado'}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setEditModalVisible(true)}
                  className="bg-white/5 p-3 rounded-xl border border-white/10"
                >
                  <Edit2 size={14} color="white" />
                </TouchableOpacity>
             </View>
          </View>

          {/* Security Group */}
          <Text className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] mb-4 ml-4">Seguridad</Text>
          <View className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
             {isBiometricSupported && (
               <View className="p-6 flex-row items-center">
                  <View className="w-10 h-10 bg-white/5 rounded-2xl items-center justify-center mr-4">
                     <Fingerprint size={18} color={biometricsEnabled ? "#D4AF37" : "rgba(255,255,255,0.6)"} />
                  </View>
                  <View className="flex-1">
                     <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Acceso VIP Extra</Text>
                     <Text className="text-white text-sm font-medium">Bloqueo Biométrico</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={handleToggleBiometrics}
                    className={`w-12 h-6 rounded-full items-center flex-row px-1 ${biometricsEnabled ? 'bg-boston-gold' : 'bg-white/10'}`}
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
            className="mt-12 bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-[2rem] py-6 items-center flex-row justify-center shadow-xl shadow-red-950/20"
          >
             <LogOut size={18} color="#ff4d4d" className="mr-4" />
             <Text className="text-[#ff4d4d] font-black text-[10px] uppercase tracking-[0.3em]">Finalizar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal remains similar but styled */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center p-6">
           <View className="w-full bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] p-8 relative overflow-hidden shadow-2xl">
              <View className="absolute top-0 right-0 w-48 h-48 bg-boston-gold rounded-full opacity-10 blur-[80px]" />
              
              <View className="flex-row justify-between items-start mb-10">
                 <View>
                    <Text className="text-2xl font-black text-white italic uppercase tracking-tighter">Editar Perfil</Text>
                    <Text className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">Tus datos de contacto</Text>
                 </View>
                 <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-3 bg-white/5 rounded-full border border-white/10">
                    <X size={20} color="white" />
                 </TouchableOpacity>
              </View>

              <View className="flex-col gap-6">
                 <View>
                    <Text className="text-[10px] font-bold text-white/30 uppercase mb-3 ml-2 tracking-widest">WhatsApp</Text>
                    <TextInput 
                      value={newWhatsapp}
                      onChangeText={(t) => setNewWhatsapp(t.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      placeholder="11 2233 4455"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="w-full bg-white/[0.03] text-white border border-white/10 rounded-2xl py-5 px-6 text-lg font-black tracking-[0.1em]"
                    />
                 </View>

                 <TouchableOpacity 
                    onPress={handleSavePhone}
                    disabled={saving}
                    className={`w-full bg-boston-gold rounded-2xl py-5 items-center shadow-xl shadow-boston-gold/20 ${saving ? 'opacity-50' : ''}`}
                  >
                    {saving ? (
                      <ActivityIndicator color="black" />
                    ) : (
                      <Text className="text-black font-black uppercase text-xs tracking-[0.3em]">Confirmar Cambios</Text>
                    )}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
    </View>
  );
}
