import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { LogOut, User, ShieldCheck, Mail, Edit2, X, Phone, Check } from 'lucide-react-native';
import api, { logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
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
  const getAuraColor = () => {
    if (!user) return 'bg-[#333]';
    switch (user.membershipLevel) {
      case 'ORO': return 'bg-[#D4AF37]';
      case 'PLATINO': return 'bg-white';
      case 'DIAMANTE': return 'bg-cyan-400';
      case 'SÚPER VIP': return 'bg-[#FF3B30]';
      default: return 'bg-[#CC6633]';
    }
  };

  return (
    <View className="flex-1 bg-[#050505] pt-20 px-6 relative">
      <StatusBar style="light" />
      
      {/* Background Aura */}
      <View className={`absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-[100px] ${getAuraColor()}`} />

      <View className="items-center mb-12 z-10">
         <View className="relative">
           <View className={`w-28 h-28 ${getAuraColor()}/10 rounded-[2rem] items-center justify-center border border-white/5 mb-4 shadow-xl overflow-hidden`}>
              <View className="absolute inset-0 bg-[#111] opacity-60" />
              <User size={50} color={user?.membershipLevel === 'PLATINO' || user?.membershipLevel === 'DIAMANTE' ? 'white' : '#D4AF37'} />
           </View>
         </View>
         <Text className="text-white text-3xl font-black italic uppercase tracking-tighter" numberOfLines={1}>{user.firstName} {user.lastName}</Text>
         <View className={`mt-3 px-4 py-1.5 rounded-full ${getAuraColor()} shadow-lg`}>
            <Text className={`text-[10px] font-black uppercase tracking-widest ${user.membershipLevel === 'DIAMANTE' || user.membershipLevel === 'PLATINO' ? 'text-black' : 'text-white'}`}>Socio {user.membershipLevel}</Text>
         </View>
      </View>

      <View className="flex-col gap-4 z-10">
         <View className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex-row items-center shadow-lg">
            <Mail size={22} color="rgba(255,255,255,0.4)" />
            <View className="ml-5 flex-1">
               <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest leading-none mb-1">Email Registrado</Text>
               <Text className="text-white text-sm font-medium leading-none mt-1" numberOfLines={1}>{user.email}</Text>
            </View>
         </View>

         <View className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex-row items-center shadow-lg">
            <ShieldCheck size={22} color="rgba(255,255,255,0.4)" />
            <View className="ml-5 flex-1">
               <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest leading-none mb-1">DNI / Identidad</Text>
               <Text className="text-white text-sm font-medium leading-none mt-1" numberOfLines={1}>{user.dni || 'No registrado'}</Text>
            </View>
         </View>

         <View className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex-row items-center shadow-lg">
            <Phone size={22} color="rgba(255,255,255,0.4)" />
            <View className="ml-5 flex-1">
               <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest leading-none mb-1">WhatsApp</Text>
               <Text className="text-white text-sm font-medium leading-none mt-1" numberOfLines={1}>{user.whatsapp || 'No registrado'}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setEditModalVisible(true)}
              className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center ml-2 border border-white/10"
            >
              <Edit2 size={16} color="white" />
            </TouchableOpacity>
         </View>

         {/* Biometric Toggle Section */}
         {isBiometricSupported && (
            <View className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex-row items-center shadow-lg">
               <Fingerprint size={22} color={biometricsEnabled ? "#D4AF37" : "rgba(255,255,255,0.4)"} />
               <View className="ml-5 flex-1">
                  <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest leading-none mb-1">Acceso VIP Extra</Text>
                  <Text className="text-white text-sm font-medium leading-none mt-1">Bloqueo con Huella / FaceID</Text>
               </View>
               <TouchableOpacity 
                 onPress={handleToggleBiometrics}
                 className={`w-12 h-6 rounded-full items-center flex-row px-1 ${biometricsEnabled ? 'bg-boston-gold shadow-lg shadow-boston-gold/20' : 'bg-white/10'}`}
               >
                 <View className={`w-4 h-4 rounded-full ${biometricsEnabled ? 'bg-black ml-auto' : 'bg-white/40'}`} />
               </TouchableOpacity>
            </View>
         )}

         <TouchableOpacity 
           activeOpacity={0.8}
           onPress={handleLogout}
           className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-3xl p-6 flex-row items-center justify-between mt-8 shadow-xl"
         >
            <View className="flex-row items-center">
               <LogOut size={20} color="#ff4d4d" />
               <Text className="text-[#ff4d4d] font-black text-xs uppercase tracking-widest ml-5">Cerrar Sesión</Text>
            </View>
         </TouchableOpacity>
      </View>

      {/* Edit WhatsApp Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center p-6">
           <View className="w-full bg-[#111] border border-white/10 rounded-[3rem] p-8 relative overflow-hidden">
              <View className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] rounded-full opacity-10 blur-[60px]" />
              
              <View className="flex-row justify-between items-start mb-6 z-10">
                 <View className="flex-1">
                    <Text className="text-2xl font-black text-white italic uppercase tracking-tighter">Editar Perfil</Text>
                    <Text className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mt-1">Actualiza tu contacto</Text>
                 </View>
                 <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2 bg-white/5 rounded-full">
                    <X size={20} color="white" />
                 </TouchableOpacity>
              </View>

              <View className="flex-col gap-4 z-10">
                 <View>
                    <Text className="text-[10px] font-bold text-white/40 uppercase mb-2 ml-1 tracking-widest">Número de WhatsApp</Text>
                    <TextInput 
                      value={newWhatsapp}
                      onChangeText={(t) => setNewWhatsapp(t.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      placeholder="Ej: 1122334455"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="w-full bg-black/40 text-white border border-white/10 rounded-2xl py-4 px-5 text-lg font-bold tracking-widest"
                    />
                 </View>

                 <TouchableOpacity 
                    onPress={handleSavePhone}
                    disabled={saving}
                    className={`w-full mt-4 bg-boston-gold rounded-2xl p-4 flex-row justify-center items-center ${saving ? 'opacity-50' : ''}`}
                 >
                    {saving ? (
                      <ActivityIndicator color="black" />
                    ) : (
                      <>
                        <Check size={18} color="black" className="mr-2" />
                        <Text className="text-black font-black uppercase text-xs tracking-widest">Guardar Cambios</Text>
                      </>
                    )}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
    </View>
  );
}
