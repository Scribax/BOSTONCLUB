"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Timer, Loader2, ShieldCheck, Sparkles, Maximize, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { formatWithDots } from "@/lib/numberFormatting";

export default function CheckinDisplay() {
  const [activeToken, setActiveToken] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };


  const fetchToken = async () => {
    setLoading(true);
    try {
      // Cargamos los ajustes para saber si hay evento y cuántos puntos dar
      const clubSettings = await apiFetch("/settings");
      setSettings(clubSettings);

      const points = clubSettings?.isEventDay 
        ? (clubSettings?.eventCheckinPoints || 1000)
        : (clubSettings?.checkinPoints || 100);

      // Generamos un QR de mesa (Check-in) que dura 2 minutos
      const data = await apiFetch("/promo/generate", {
        method: "POST",
        body: JSON.stringify({ 
          points: points, 
          type: "DAILY_CHECKIN", 
          expiresMinutes: 2 
        })
      });
      setActiveToken(data);
      setTimeLeft(60); // Rotamos cada 60 segundos
    } catch (err) {
      console.error("Error al generar token", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      fetchToken();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const qrUrl = activeToken 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${activeToken.token}&color=000000&bgcolor=FFFFFF`
    : null;

  const isEvent = settings?.isEventDay;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden relative group transition-colors duration-1000 ${isEvent ? 'bg-[#050505]' : 'bg-boston-black'}`}>
      {/* Control Buttons (Hidden by default, show on hover) */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-[70]">
        <Link href="/admin/promo" className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Regalar Puntos</span>
        </Link>
        <button 
          onClick={toggleFullscreen}
          className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white transition-colors"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      {/* Background Effects */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] animate-pulse transition-colors duration-1000 ${isEvent ? 'bg-boston-gold/10' : 'bg-boston-red/5'}`} />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20" />
      
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center z-10 mb-12"
      >
        <div className={`w-24 h-24 bg-gradient-to-br from-[#111] to-black rounded-3xl flex items-center justify-center mx-auto mb-6 border shadow-2xl relative transition-colors ${isEvent ? 'border-boston-gold/30' : 'border-white/5'}`}>
            <Sparkles className={`absolute -top-2 -right-2 w-6 h-6 animate-bounce ${isEvent ? 'text-boston-gold' : 'text-boston-red-glow'}`} />
            <Crown className={`w-12 h-12 ${isEvent ? 'text-boston-gold' : 'text-white/20'}`} />
        </div>
        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-2">
            Boston <span className={isEvent ? 'text-boston-gold' : 'text-boston-red-glow'}>Club</span>
        </h1>
        {isEvent ? (
          <div className="flex flex-col items-center gap-4">
            <motion.span 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-boston-gold text-black px-8 py-2 rounded-full text-sm font-black uppercase tracking-[0.5em] shadow-[0_0_40px_rgba(212,175,55,0.6)] border-2 border-white/20"
            >
              ¡EVENTO ESPECIAL ACTIVO!
            </motion.span>
            <p className="text-white font-black tracking-[0.2em] uppercase text-3xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Check-in de Socio • SUMA {formatWithDots(settings?.eventCheckinPoints || 1000)} PUNTOS
            </p>
          </div>
        ) : (
          <p className="text-white/60 font-black tracking-[0.5em] uppercase text-sm">
            Check-in de Socio • Suma {settings?.checkinPoints || 100} Puntos
          </p>
        )}
      </motion.div>

      {/* QR CONTAINER */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {loading && !activeToken ? (
            <motion.div 
              key="loader"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-[500px] h-[500px] bg-white/5 rounded-[4rem] flex items-center justify-center border border-white/10 backdrop-blur-xl"
            >
              <Loader2 className="w-16 h-16 text-boston-gold animate-spin" />
            </motion.div>
          ) : (
            <motion.div 
              key={activeToken?.id}
              initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.1, opacity: 0, rotate: 5 }}
              transition={{ type: "spring", damping: 15 }}
              className={`bg-white p-12 rounded-[4rem] shadow-[0_0_100px_rgba(255,255,255,0.05)] relative border-[8px] transition-colors duration-1000 ${isEvent ? 'border-boston-gold shadow-[0_0_60px_rgba(212,175,55,0.3)]' : 'border-transparent'}`}
            >
              <div className={`absolute -top-6 -left-6 text-white font-black px-8 py-3 rounded-full shadow-2xl text-xl uppercase tracking-wider rotate-[-12deg] transition-colors ${isEvent ? 'bg-boston-gold !text-black' : 'bg-boston-red'}`}>
                 Escanea Aquí
              </div>
              
              {qrUrl && <img src={qrUrl} alt="Checkin QR" className="w-[400px] h-[400px]" />}
              
              <div className={`absolute -bottom-6 -right-6 text-black font-black px-8 py-3 rounded-full shadow-2xl text-xl uppercase tracking-wider rotate-[5deg] flex items-center gap-2 transition-colors ${isEvent ? 'bg-white' : 'bg-boston-gold'}`}>
                 <ShieldCheck className="w-6 h-6" />
                 Código Seguro
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER & TIMER */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-20 w-full max-w-xl z-10"
      >
        <div className="flex justify-between items-end mb-4 px-2">
            <div className="flex items-center gap-3">
                <Timer className={`${isEvent ? 'text-boston-gold' : 'text-white/60'} w-6 h-6`} />
                <span className={`${isEvent ? 'text-boston-gold' : 'text-white/80'} font-black uppercase tracking-[0.2em] text-xs`}>
                    Siguiente código en {timeLeft}s
                </span>
            </div>
            <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest">
                Protección Anti-Fraude Activa
            </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div 
                key={activeToken?.id}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 60, ease: "linear" }}
                className={`h-full ${isEvent ? 'bg-gradient-to-r from-boston-gold via-white to-boston-gold' : 'bg-gradient-to-r from-boston-red to-red-900'}`}
            />
        </div>
        
        <p className="text-center mt-12 text-white/40 font-black uppercase tracking-[0.5em] text-[10px]">
            © 2026 Boston Club Social • Reservado para Socios
        </p>
      </motion.div>
    </div>
  );
}
