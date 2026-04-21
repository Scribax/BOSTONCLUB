import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, StyleSheet, Modal, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, ScanLine, Sparkles, CheckCircle2, AlertCircle, XCircle, HelpCircle, Smartphone, CreditCard, Flame } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../lib/api';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "pos_waiting">("idle");
  const [message, setMessage] = useState("");
  const [scanned, setScanned] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'pos_waiting' && currentOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/payments/status/${currentOrderId}`);
          if (res.data.status === 'SUCCESS') {
            setStatus('success');
            setMessage(`PAGO REALIZADO\nSe han acreditado ${res.data.amount} puntos en tu cuenta.`);
            clearInterval(interval);
          }
        } catch (err) {
          // Ignoramos errores temporales de red para que siga intentando
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, currentOrderId]);

  useFocusEffect(
    useCallback(() => {
      // Reiniciar el scanner automáticamente al volver a la pantalla
      setStatus("idle");
      setMessage("");
      setScanned(false);
      setCurrentOrderId(null);
    }, [])
  );

  if (!permission) {
    return <View className="flex-1 bg-boston-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-boston-black items-center justify-center p-10">
        <ScanLine size={60} color="#D4AF37" className="mb-6 opacity-20" />
        <Text className="text-white text-xl font-black uppercase italic text-center mb-4">Acceso a la Cámara</Text>
        <Text className="text-white/50 text-center mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
          Necesitamos tu cámara para escanear el QR del POSNET y acreditar tus puntos.
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

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || status !== 'idle') return;
    setScanned(true);
    setStatus('loading');

    try {
      // 1. Detectar si es un QR de Mercado Pago (POSNET, QR Interoperable, etc.)
      const mpPatterns = [
        /mercadopago\.com.*?\/([a-zA-Z0-9_-]+)$/, // Dominios generales
        /mpago\.la\/([a-zA-Z0-9_-]+)$/,           // Links cortos
        /qr\.mercadopago\.com\/([a-zA-Z0-9_-]+)/  // QRs de stickers y Smart POS
      ];

      let orderId = null;

      // Caso A: Es un link de Mercado Pago
      for (const pattern of mpPatterns) {
        const match = data.match(pattern);
        if (match) {
          orderId = match[1];
          break;
        }
      }

      // Caso B: Es un QR "en bruto" (EMVCo) como el de la captura (contiene mercadolibre/mercadopago)
      if (!orderId && (data.includes("mercadolibre") || data.includes("mercadopago"))) {
        // Intentamos extraer un UUID (Ese código largo con guiones que vimos)
        const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
        const uuidMatch = data.match(uuidRegex);
        if (uuidMatch) {
          orderId = uuidMatch[0];
        } else {
          // Si no hay UUID, mandamos una parte significativa del string
          orderId = data.slice(0, 50); 
        }
      }

      if (orderId) {
        console.log("[SCANNER] Mercado Pago detectado. ID:", orderId);
        setMessage("Vinculando pago con tu cuenta...");
        
        await api.post('/payments/track-pos', { orderId });

        setStatus("success");
        
        if (data.startsWith("http")) {
          setMessage("¡Vinculado con éxito! Redirigiendo para completar el pago...");
          setTimeout(() => {
            Linking.openURL(data).catch(() => {
              setStatus("error");
              setMessage("No se pudo abrir la aplicación de Mercado Pago.");
            });
          }, 2000);
        } else {
          setCurrentOrderId(orderId);
          setStatus("pos_waiting");
          setMessage("QR POSNET DETECTADO\nPor favor, termine el pago en su billetera virtual o en el POSNET.");
        }
        return;
      }

      // 2. Procesar como un QR de puntos normal
      const response = await api.post('/promo/claim', { token: data });
      setStatus("success");
      setMessage(response.data.message || "Puntos acreditados con éxito.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Error al procesar el código. Intenta nuevamente.");
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setStatus('idle');
    setMessage('');
    setCurrentOrderId(null);
  };

  return (
    <View className="flex-1 bg-[#050505]">
      {/* Header Modal Style */}
      <View className="pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-white/5 bg-black/50 z-20">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="p-3 bg-white/5 rounded-full mr-4">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tight text-white italic">Escanear QR</Text>
        </View>
        <TouchableOpacity onPress={() => setShowTutorial(true)} className="p-3 bg-boston-gold/10 border border-boston-gold/20 rounded-full">
          <HelpCircle size={20} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center relative">
        {status === 'idle' && (
          <View className="flex-1 absolute inset-0 z-0">
             <CameraView 
               style={StyleSheet.absoluteFillObject}
               onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
               barcodeScannerSettings={{
                 barcodeTypes: ["qr"],
               }}
             />
             {/* Overlay UI when Camera is active */}
             <View className="flex-1 bg-black/40 justify-center items-center">
                <View className="w-64 h-64 border-[3px] border-boston-gold/50 rounded-[40px] border-dashed items-center justify-center bg-black/10">
                   <View className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-boston-gold rounded-tl-[20px]" />
                   <View className="absolute -top-4 -right-4 w-8 h-8 border-t-4 border-r-4 border-boston-gold rounded-tr-[20px]" />
                   <View className="absolute -bottom-4 -left-4 w-8 h-8 border-b-4 border-l-4 border-boston-gold rounded-bl-[20px]" />
                   <View className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-boston-gold rounded-br-[20px]" />
                </View>
                <View className="bg-black/60 px-6 py-3 rounded-full mt-10 border border-white/10">
                  <Text className="text-boston-gold font-bold uppercase text-[10px] tracking-widest text-center">Enfoque el código QR</Text>
                </View>
                <Text className="text-white/80 text-[11px] text-center mt-6 uppercase font-black tracking-[0.2em] px-10 leading-5">
                   CENTRO DE ESCANEO UNIVERSAL
                </Text>
                <Text className="text-white/40 text-[9px] text-center mt-2 uppercase tracking-[0.1em] px-12 leading-4">
                   Apunta aquí para realizar pagos, hacer tu Check-in o sumar puntos con los códigos del Club.
                </Text>
             </View>
          </View>
        )}

        {status === 'loading' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
             <ActivityIndicator size="large" color="#D4AF37" className="mb-6 scale-150" />
             <Text className="text-sm font-bold uppercase tracking-widest text-white animate-pulse">Validando código...</Text>
          </View>
        )}

        {status === 'pos_waiting' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
             <ActivityIndicator size="large" color="#D4AF37" className="mb-6 scale-150" />
             <Text className="text-2xl font-black mb-4 uppercase italic text-boston-gold text-center">ESPERANDO PAGO</Text>
             <Text className="text-white/60 text-sm mb-10 text-center font-medium leading-relaxed px-6">
               {message}
             </Text>
             <TouchableOpacity 
               onPress={resetScanner}
               className="bg-white/10 px-8 py-4 rounded-2xl w-full border border-white/5"
             >
               <Text className="text-white font-black text-xs uppercase tracking-widest text-center">Cancelar / Volver</Text>
             </TouchableOpacity>
          </View>
        )}

        {status === 'success' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
            <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-8 shadow-lg">
              <CheckCircle2 size={40} color="white" />
            </View>
            <Text className="text-2xl font-black mb-4 uppercase italic text-white text-center">¡Procesado!</Text>
            <Text className="text-white/60 text-sm mb-10 text-center font-medium leading-relaxed px-6">
              {message}
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)')}
              className="bg-white px-8 py-4 rounded-2xl w-full"
            >
              <Text className="text-black font-black text-xs uppercase tracking-widest text-center">Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View className="items-center justify-center p-10 z-10 bg-[#050505] flex-1">
            <View className="w-20 h-20 bg-boston-red rounded-full items-center justify-center mb-8 shadow-lg">
              <XCircle size={40} color="white" />
            </View>
            <Text className="text-2xl font-black mb-4 uppercase italic text-boston-red-glow text-center">Aviso</Text>
            <Text className="text-white/60 text-sm mb-10 text-center font-medium leading-relaxed px-6">
              {message}
            </Text>
            <TouchableOpacity 
              onPress={resetScanner}
              className="bg-white/10 px-8 py-4 rounded-2xl w-full border border-white/5"
            >
              <Text className="text-white font-black text-xs uppercase tracking-widest text-center">Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tutorial Modal */}
      <Modal visible={showTutorial} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-center p-6">
          <View className="bg-[#0D0D0D] border border-white/10 rounded-[35px] overflow-hidden relative max-h-[85%]">
            <View className="absolute top-0 right-0 w-40 h-40 bg-boston-gold rounded-full opacity-10 blur-[60px]" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 30 }}>
              <View className="items-center mb-8 pt-4">
                <View className="w-16 h-16 bg-boston-gold/10 rounded-full items-center justify-center mb-4 border border-boston-gold/20">
                  <ScanLine size={30} color="#D4AF37" />
                </View>
                <Text className="text-2xl font-black text-white italic uppercase tracking-tighter text-center">Cómo sumar{"\n"}tus Puntos</Text>
                <Text className="text-white/50 text-[10px] uppercase tracking-widest text-center mt-2">Guía rápida de escaneo</Text>
              </View>

              <View className="flex-col gap-5 mb-8">
                <View className="flex-row gap-4 items-start bg-white/5 p-4 rounded-3xl border border-white/5">
                  <View className="mt-1 w-8 h-8 rounded-full bg-white items-center justify-center shadow-lg">
                    <Text className="text-black font-black italic text-xs">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-black uppercase text-[11px] tracking-widest mb-1.5">Avisa al Staff</Text>
                    <Text className="text-white/60 text-[11px] leading-tight">Dile al mozo que vas a pagar escaneando el código QR del POSNET de Mercado Pago.</Text>
                  </View>
                </View>

                <View className="flex-row gap-4 items-start bg-white/5 p-4 rounded-3xl border border-white/5">
                  <View className="mt-1 w-8 h-8 rounded-full bg-white items-center justify-center shadow-lg">
                    <Text className="text-black font-black italic text-xs">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-black uppercase text-[11px] tracking-widest mb-1.5">Escanea desde aquí</Text>
                    <Text className="text-white/60 text-[11px] leading-tight">Apunta la cámara de esta pantalla directamente al QR amarillo que aparece en el POSNET.</Text>
                  </View>
                </View>

                <View className="flex-row gap-4 items-start bg-white/5 p-4 rounded-3xl border border-white/5">
                  <View className="mt-1 w-8 h-8 rounded-full bg-white items-center justify-center shadow-lg">
                    <Text className="text-black font-black italic text-xs">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-black uppercase text-[11px] tracking-widest mb-1.5">Completa el pago</Text>
                    <Text className="text-white/60 text-[11px] leading-tight">Nosotros detectaremos el QR. Ya puedes terminar de pagar apoyando tu tarjeta o usar tu billetera virtual.</Text>
                  </View>
                </View>

                <View className="flex-row gap-4 items-start bg-boston-gold/10 p-5 rounded-3xl border border-boston-gold/30 mt-2">
                  <View className="mt-0.5 w-8 h-8 rounded-full bg-[#D4AF37] items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                    <Sparkles size={16} color="black" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-boston-gold font-black uppercase text-[11px] tracking-widest mb-1.5">¡Magia Automática!</Text>
                    <Text className="text-white/80 text-[11px] leading-tight italic">Apenas salga el ticket impreso en el local, verás los puntos brillar instantáneamente en tu celular.</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setShowTutorial(false)}
                className="bg-white py-5 rounded-[20px] items-center shadow-[0_0_20px_rgba(255,255,255,0.2)] w-full"
              >
                <Text className="text-black font-black uppercase text-xs tracking-widest text-center">¡Entendido! Vamos</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
