import React, { useState, useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import ScannerDefault from '../../components/scanner/ScannerDefault';
import ScannerHalloween from '../../components/scanner/ScannerHalloween';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { theme } = useTheme();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "pos_waiting">("idle");
  const [message, setMessage] = useState("");
  const [scanned, setScanned] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;
    if (status === 'pos_waiting' && currentOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/payments/status/${currentOrderId}`);
          if (res.data.status === 'SUCCESS') {
            setStatus('success');
            setMessage(`PAGO REALIZADO\nSe han acreditado ${res.data.pointsAwarded || res.data.amount} puntos en tu cuenta.`);
            clearInterval(interval);
            clearTimeout(timeout);
          }
        } catch (err) {}
      }, 3000);

      timeout = setTimeout(() => {
        clearInterval(interval);
        setStatus('error');
        setMessage('No se recibió confirmación del pago. Por favor, revisá tu historial en Mercado Pago.');
      }, 5 * 60 * 1000);
    }
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [status, currentOrderId]);

  useFocusEffect(
    useCallback(() => {
      setStatus("idle");
      setMessage("");
      setScanned(false);
      setCurrentOrderId(null);
    }, [])
  );

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || status !== 'idle') return;
    setScanned(true);
    setStatus('loading');

    try {
      const mpPatterns = [
        /mercadopago\.com.*?\/([a-zA-Z0-9_-]+)$/,
        /mpago\.la\/([a-zA-Z0-9_-]+)$/,
        /qr\.mercadopago\.com\/([a-zA-Z0-9_-]+)/
      ];

      let orderId = null;
      for (const pattern of mpPatterns) {
        const match = data.match(pattern);
        if (match) {
          orderId = match[1];
          break;
        }
      }

      if (!orderId && (data.includes("mercadolibre") || data.includes("mercadopago"))) {
        const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
        const uuidMatch = data.match(uuidRegex);
        orderId = uuidMatch ? uuidMatch[0] : data.slice(0, 50);
      }

      if (orderId) {
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

  if (!permission) return null;

  const props = {
    permission, requestPermission, status, message, scanned, handleBarcodeScanned, resetScanner, showTutorial, setShowTutorial, theme
  };

  if (theme.name === 'halloween') {
    return <ScannerHalloween {...props} />;
  }

  return <ScannerDefault {...props} />;
}
