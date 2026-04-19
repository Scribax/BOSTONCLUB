"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, ShieldCheck, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminScanPage() {
  const [scanResult, setScanResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
  const [message, setMessage] = useState("");
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      // The decodedText is the token
      setScanResult(decodedText);
      handleConfirm(decodedText);
      scanner.clear(); // Stop scanning once we get a result
    }

    function onScanFailure(error: any) {
      // console.warn(`Code scan error = ${error}`);
    }

    return () => {
      scanner.clear().catch(e => console.error("Scanner cleanup failed", e));
    };
  }, []);

  const handleConfirm = async (token: string) => {
    if (!token) return;
    setLoading(true);
    setStatus("IDLE");
    try {
      const data = await apiFetch("/redemptions/confirm", {
        method: "POST",
        body: JSON.stringify({ qrToken: token })
      });
      setStatus("SUCCESS");
      setMessage(data.message || "¡Canje exitoso!");
    } catch (err: any) {
      setStatus("ERROR");
      setMessage(err.message || "Error al validar el código");
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    window.location.reload(); // Simplest way to restart the lib
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="text-center">
        <div className="inline-flex p-3 bg-boston-red/10 rounded-2xl mb-4">
          <QrCode className="w-8 h-8 text-boston-red-glow" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-widest uppercase">Validar Canje</h1>
        <p className="text-white/50 text-sm">Escanea el QR del cliente para confirmar la entrega del premio.</p>
      </header>

      <AnimatePresence mode="wait">
        {status === "IDLE" ? (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5 bg-black p-2">
               <div id="reader" className="w-full"></div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[.3em]">
                <span className="bg-[#050505] px-4 text-white/20">O ingresa el código</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                placeholder="Token del QR..."
                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-boston-gold transition-colors"
              />
              <button 
                onClick={() => handleConfirm(manualToken)}
                disabled={loading || !manualToken}
                className="bg-white text-black px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-panel p-10 rounded-[3rem] border flex flex-col items-center text-center ${status === 'SUCCESS' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}
          >
            {status === 'SUCCESS' ? (
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mb-6" />
            )}
            
            <h2 className={`text-2xl font-black uppercase tracking-tight mb-2 ${status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>
              {status === 'SUCCESS' ? "¡Canje Confirmado!" : "Error de Validación"}
            </h2>
            <p className="text-white/70 font-medium mb-8 max-w-xs mx-auto">
              {message}
            </p>

            <button 
              onClick={resetScanner}
              className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
            >
              Escanear otro <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="pt-8 border-t border-white/5">
        <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-boston-gold shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-wider">
            Al confirmar, los puntos se restarán automáticamente del saldo del socio y la operación quedará registrada en el historial de auditoría.
          </p>
        </div>
      </footer>
    </div>
  );
}
