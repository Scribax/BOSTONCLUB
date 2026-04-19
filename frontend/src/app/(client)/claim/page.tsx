"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ClaimPointsPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStarting = useRef(false);

  useEffect(() => {
    const startScanner = async () => {
      // 1. Semáforo: Si ya está iniciando o ya hay uno, abortamos
      if (isStarting.current || (scannerRef.current && scannerRef.current.isScanning)) return;
      isStarting.current = true;

      // 2. Pequeño respiro para estabilizar el DOM (Vital para el reinicio móvil)
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. Limpieza absoluta del contenedor
      const container = document.getElementById("reader");
      if (container) container.innerHTML = "";

      try {
        // 4. Nueva instancia
        scannerRef.current = new Html5Qrcode("reader");
        
        await scannerRef.current.start(
          { facingMode: "environment" }, 
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScanResult(decodedText);
            scannerRef.current?.stop().then(() => {
              claimPoints(decodedText);
            });
          },
          () => {} 
        );
      } catch (err) {
        console.error("Scanner init error:", err);
        isStarting.current = false; // Permitimos re-intento si falló
      }
    };

    startScanner();

    return () => {
      isStarting.current = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const claimPoints = async (token: string) => {
    setStatus("loading");
    try {
      const data = await apiFetch("/promo/claim", {
        method: "POST",
        body: JSON.stringify({ token })
      });
      setStatus("success");
      setMessage(data.message);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Error al reclamar puntos");
    }
  };

  return (
    <div className="min-h-screen bg-boston-black text-white p-6">
      <header className="mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-white/5 rounded-full shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold uppercase tracking-tight italic">Escanear QR</h1>
      </header>

      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-center"
            >
              <div id="reader" className="overflow-hidden rounded-3xl border border-white/10 glass-panel" />
              <div className="pt-4 px-6 space-y-2">
                <p className="text-boston-gold font-bold uppercase text-[10px] tracking-widest">Enfoque el código QR</p>
                <p className="text-white/40 text-[10px] leading-relaxed">
                  Escanea el código del staff o el de tu mesa para sumar puntos extra a tu cuenta.
                </p>
              </div>
            </motion.div>
          )}

          {status === "loading" && (
            <motion.div 
              key="loading"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 border-4 border-boston-gold border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Validando código...</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div 
              key="success"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-10 rounded-[3rem] border border-green-500/30 flex flex-col items-center text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-4 uppercase italic">¡Puntos Sumados!</h2>
              <p className="text-white/60 text-sm mb-10 leading-relaxed font-medium">
                {message}
              </p>
              <Link 
                href="/dashboard"
                className="bg-white text-black font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:scale-105 transition-all w-full"
              >
                Volver al Home
              </Link>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div 
              key="error"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-10 rounded-[3rem] border border-boston-red/30 flex flex-col items-center text-center shadow-[0_0_50px_rgba(255,59,48,0.1)]"
            >
              <div className="w-20 h-20 bg-boston-red rounded-full flex items-center justify-center mb-8 shadow-lg shadow-red-500/20">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-4 uppercase italic text-boston-red-glow">Aviso</h2>
              <p className="text-white/60 text-sm mb-10 leading-relaxed font-medium">
                {message}
              </p>
              <button 
                onClick={() => setStatus("idle")}
                className="bg-white/10 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-white/20 transition-all w-full"
              >
                Intentar de nuevo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
