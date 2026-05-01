import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, CheckCircle2, XCircle, Scan, History as HistoryIcon, LogOut } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api, { logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';

export default function StaffScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [scanned, setScanned] = useState(false);
  const [redemptionData, setRedemptionData] = useState<any>(null);
  const router = useRouter();

  const resetScanner = () => {
    setScanned(false);
    setStatus('idle');
    setMessage('');
    setRedemptionData(null);
  };

  useFocusEffect(
    useCallback(() => {
      // Guard de rol: si un cliente llegara a esta pantalla, lo redirigimos
      api.get('/auth/me').then(res => {
        const role = res.data.role?.toUpperCase();
        if (role !== 'ADMIN' && role !== 'STAFF') {
          router.replace('/(tabs)');
        }
      }).catch(() => router.replace('/login'));

      resetScanner();
    }, [])
  );

  if (!permission) {
    return <View className="flex-1 bg-boston-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-boston-black items-center justify-center p-10">
        <Scan size={60} color="#D4AF37" className="mb-6 opacity-20" />
        <Text className="text-white text-xl font-black uppercase italic text-center mb-4">Acceso Staff</Text>
        <Text className="text-white/50 text-center mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
          Necesitas acceso a la cámara para validar los QRs de los clientes.
        </Text>
        <TouchableOpacity 
          onPress={requestPermission}
          className="bg-boston-gold px-10 py-5 rounded-2xl"
        >
          <Text className="text-black font-black uppercase text-xs italic">Permitir Acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || status !== 'idle') return;
    setScanned(true);
    setStatus('loading');

    try {
      // Intentar validar el QR del cliente
      const response = await api.post('/redemptions/confirm', { qrToken: data });
      
      Vibration.vibrate(100);
      setStatus("success");
      setMessage(response.data.message || "Canje confirmado con éxito.");
      setRedemptionData(response.data.redemption);
    } catch (err: any) {
      Vibration.vibrate([0, 100, 50, 100]);
      setStatus("error");
      setMessage(err.response?.data?.message || "Error al validar el código. Asegúrate de que no haya expirado.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas salir del modo staff?", [
      { text: "No", style: "cancel" },
      { text: "Sí, Salir", style: "destructive", onPress: async () => {
          await logout();
          router.replace('/login');
      }}
    ]);
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />
      
      {/* Staff Header */}
      <View className="pt-16 pb-6 px-6 flex-row items-center justify-between border-b border-white/5 bg-black/80 z-20">
        <View>
          <Text className="text-[10px] font-black text-boston-gold uppercase tracking-[0.3em] mb-1">Panel de Control</Text>
          <Text className="text-xl font-black uppercase tracking-tight text-white italic">MODO STAFF</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} className="p-3 bg-white/5 rounded-full">
          <LogOut size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center relative">
        {status === 'idle' ? (
          <View className="flex-1 absolute inset-0 z-0">
             <CameraView 
               style={StyleSheet.absoluteFillObject}
               onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
               barcodeScannerSettings={{
                 barcodeTypes: ["qr"],
               }}
             />
             <View className="flex-1 bg-black/60 justify-center items-center">
                <View className="w-72 h-72 border-[4px] border-boston-gold rounded-[50px] items-center justify-center bg-black/20">
                   <View className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-8 border-boston-gold rounded-tl-[40px]" />
                   <View className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-8 border-boston-gold rounded-tr-[40px]" />
                   <View className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-8 border-boston-gold rounded-bl-[40px]" />
                   <View className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-8 border-boston-gold rounded-br-[40px]" />
                   
                   <Scan size={40} color="rgba(212, 175, 55, 0.4)" />
                </View>
                
                <View className="bg-boston-gold px-8 py-3 rounded-full mt-12 shadow-2xl">
                   <Text className="text-black font-black uppercase text-[12px] tracking-widest text-center">ESCANEAR QR CLIENTE</Text>
                </View>
                
                <Text className="text-white/40 text-[10px] text-center mt-6 uppercase tracking-[0.1em] px-12 leading-4">
                   Enfoca el QR dinámico que el cliente tiene en su pantalla para validar el beneficio.
                </Text>
             </View>
          </View>
        ) : (
          <View className="flex-1 bg-black items-center justify-center p-10">
             {status === 'loading' && (
               <ActivityIndicator size="large" color="#D4AF37" />
             )}
             
             {status === 'success' && (
               <View className="items-center w-full">
                  <View className="w-24 h-24 bg-green-500/20 rounded-full items-center justify-center mb-6 border border-green-500/30">
                    <CheckCircle2 size={48} color="#22c55e" />
                  </View>
                  <Text className="text-white text-3xl font-black uppercase italic text-center mb-2 tracking-tighter">¡VALIDADO!</Text>
                  <Text className="text-green-400 text-sm font-bold uppercase tracking-widest mb-8 text-center">{message}</Text>
                  
                  {redemptionData && (
                    <View className="bg-white/5 border border-white/10 rounded-3xl p-6 w-full mb-10">
                       <Text className="text-white/40 text-[10px] font-black uppercase mb-1">Cliente</Text>
                       <Text className="text-white text-lg font-bold mb-4 uppercase italic">{redemptionData.user?.firstName} {redemptionData.user?.lastName}</Text>
                       
                       <Text className="text-white/40 text-[10px] font-black uppercase mb-1">Premio/Beneficio</Text>
                       <Text className="text-boston-gold text-xl font-black uppercase">{redemptionData.reward?.name || redemptionData.event?.title || redemptionData.vipBenefit?.title}</Text>
                    </View>
                  )}

                  <TouchableOpacity 
                    onPress={resetScanner}
                    className="bg-white/10 border border-white/20 w-full py-5 rounded-2xl items-center"
                  >
                    <Text className="text-white font-black uppercase text-sm tracking-widest">Siguiente Cliente</Text>
                  </TouchableOpacity>
               </View>
             )}

             {status === 'error' && (
               <View className="items-center w-full">
                  <View className="w-24 h-24 bg-red-500/20 rounded-full items-center justify-center mb-6 border border-red-500/30">
                    <XCircle size={48} color="#ef4444" />
                  </View>
                  <Text className="text-white text-3xl font-black uppercase italic text-center mb-2 tracking-tighter">ERROR</Text>
                  <Text className="text-red-400 text-sm font-bold uppercase tracking-widest mb-10 text-center">{message}</Text>
                  
                  <TouchableOpacity 
                    onPress={resetScanner}
                    className="bg-white/10 border border-white/20 w-full py-5 rounded-2xl items-center"
                  >
                    <Text className="text-white font-black uppercase text-sm tracking-widest">Reintentar</Text>
                  </TouchableOpacity>
               </View>
             )}
          </View>
        )}
      </View>
    </View>
  );
}
