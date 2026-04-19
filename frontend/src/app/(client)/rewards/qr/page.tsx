"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, ShieldCheck, Ticket, CheckCircle2, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "@/lib/api";

function QRContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const rewardName = searchParams.get("reward");
  
  const [timeLeft, setTimeLeft] = useState(600);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/rewards");
      return;
    }

    // Cronómetro de expiración
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // SENSOR DE ESTADO (Polling): Pregunta cada 3 segundos si ya fue validado
    const statusChecker = setInterval(async () => {
      if (isCompleted) return;
      try {
        const data = await apiFetch(`/redemptions/status/${token}`);
        if (data.status === "COMPLETED") {
          setIsCompleted(true);
          clearInterval(statusChecker);
          clearInterval(timer);
        }
      } catch (err) {
        // Ignoramos errores de red momentáneos
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(statusChecker);
    };
  }, [token, router, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${token}&color=D4AF37&bgcolor=000000`;

  return (
    <div className="min-h-screen bg-boston-black flex flex-col p-6 overflow-hidden">
      <Link href="/rewards" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 mb-8 relative z-10 transition-transform active:scale-90">
        <ArrowLeft className="w-5 h-5 text-white" />
      </Link>

      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full relative">
        <AnimatePresence mode="wait">
          {!isCompleted ? (
            <motion.div 
              key="qr-active"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              className="w-full glass-panel p-8 rounded-[3rem] border border-white/10 flex flex-col items-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                 <ShieldCheck className="w-6 h-6 text-boston-gold opacity-30" />
              </div>

              <span className="text-[10px] font-black text-boston-red-glow uppercase tracking-[0.3em] mb-2 animate-pulse">Canje Autorizado</span>
              <h2 className="text-white font-black text-xl text-center leading-tight mb-8 px-2">
                {rewardName || "Premio Seleccionado"}
              </h2>

              <div className="bg-black p-4 rounded-3xl border border-boston-gold/20 shadow-inner relative group">
                <div className="absolute inset-0 bg-boston-gold/10 filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <img 
                  src={qrUrl} 
                  alt="Código QR de Canje" 
                  className="w-64 h-64 relative z-10 rounded-xl"
                />
              </div>

              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                  <Clock className="w-4 h-4 text-white/40" />
                  <span className={`font-mono font-bold text-sm ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <p className="text-white/30 text-[10px] text-center uppercase tracking-widest font-bold">
                  Muestra este código al staff<br/> para completar tu canje
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="qr-success"
              initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="w-full glass-panel p-10 rounded-[3rem] border border-boston-gold/30 flex flex-col items-center shadow-[0_0_50px_rgba(212,175,55,0.2)] relative overflow-hidden"
            >
              {/* Celebreation particles background effect (simulated) */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ y: [-10, 10], opacity: [0.3, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.3, repeatType: "reverse" }}
                    className="absolute w-1 h-1 bg-boston-gold rounded-full"
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  />
                ))}
              </div>

              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-white font-black text-3xl text-center leading-none mb-4 italic">
                ¡CANJE<br/><span className="text-boston-gold">EXITOSO!</span>
              </h2>
              
              <p className="text-white/60 text-sm text-center font-medium mb-8 px-4">
                El staff ha confirmado la entrega de tu <span className="text-white font-bold">{rewardName}</span>.
              </p>

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-boston-gold/30 to-transparent mb-8" />

              <button 
                onClick={() => router.push("/dashboard")}
                className="bg-white text-black font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Volver al Inicio
              </button>
              
              <div className="absolute -bottom-6 -left-6 opacity-20">
                <PartyPopper className="w-20 h-20 text-boston-gold" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isCompleted && (
            <motion.div 
              exit={{ opacity: 0, y: 10 }}
              className="mt-12 text-center space-y-4"
            >
               <div className="flex items-center justify-center gap-1.5 text-white/20">
                 <Ticket className="w-3 h-3" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em]">Ticket ID: {token?.substring(0, 8)}...</span>
               </div>
               
               <p className="text-white/40 text-[10px] leading-relaxed max-w-[250px]">
                 No cierres esta pantalla hasta que el staff confirme el canje. Si el tiempo expira, los puntos no se descontarán.
               </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function RedeemQRPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-boston-black flex items-center justify-center text-white/30 uppercase font-black text-xs italic tracking-widest animate-pulse">Cargando código...</div>}>
      <QRContent />
    </Suspense>
  );
}
