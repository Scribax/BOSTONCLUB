"use client";

import { motion, AnimatePresence } from "framer-motion";
import DigitalCard from "@/components/DigitalCard";
import PWAInstallButton from "@/components/PWAInstallButton";
import { Gift, CalendarDays, History, MapPin, Ticket, Flame, ArrowRight, QrCode, User, Crown, CreditCard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, logout } from "@/lib/api";
import { useRouter } from "next/navigation";

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  points: number;
  membershipLevel: string;
  referralCode?: string;
  referralRewardReferrer?: number;
};

type BannerEvent = {
  id: string;
  title: string;
  description: string;
  benefits?: string;
  imageUrl?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [banners, setBanners] = useState<BannerEvent[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [userData, events, clubSettings] = await Promise.all([
          apiFetch("/auth/me"),
          apiFetch("/events").catch(() => []),
          apiFetch("/settings").catch(() => null)
        ]);
        setUser(userData);
        setSettings(clubSettings);
        
        const filteredBanners = events.filter((e: any) => e.type === "BANNER" && e.isActive !== false);
        setBanners(filteredBanners);
      } catch (err) {
        console.error("Session expired or invalid");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const banner = banners[currentBannerIdx];

  const calculateNextTier = () => {
    if (!user || !settings) return undefined;
    
    const pts = user.points;
    let nextTierName = "";
    let nextTierPts = 0;
    let currentTierPts = 0;

    if (pts < settings.goldThreshold) {
      nextTierName = "ORO";
      nextTierPts = settings.goldThreshold;
      currentTierPts = 0;
    } else if (pts < settings.platinumThreshold) {
      nextTierName = "PLATINO";
      nextTierPts = settings.platinumThreshold;
      currentTierPts = settings.goldThreshold;
    } else if (pts < settings.diamondThreshold) {
      nextTierName = "DIAMANTE";
      nextTierPts = settings.diamondThreshold;
      currentTierPts = settings.platinumThreshold;
    } else if (pts < settings.superVipThreshold) {
      nextTierName = "SÚPER VIP";
      nextTierPts = settings.superVipThreshold;
      currentTierPts = settings.diamondThreshold;
    } else {
      return undefined; // Max level reached
    }

    const progress = Math.min(100, Math.max(0, ((pts - currentTierPts) / (nextTierPts - currentTierPts)) * 100));
    
    return {
      name: nextTierName,
      pointsNeeded: nextTierPts,
      currentProgress: progress
    };
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-boston-black flex items-center justify-center text-white/50 animate-pulse uppercase font-black tracking-widest italic">Boston Club...</div>;
  }

  return (
    <div className="min-h-screen bg-boston-black pb-32 overflow-x-hidden">
      {/* Dynamic Aura (Optimized for mobile GPU) */}
      <div className={`fixed top-[-5%] right-[-10%] w-64 h-64 rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none transition-colors duration-700 ${user.membershipLevel === 'ORO' ? 'bg-boston-gold' : (user.membershipLevel === 'PLATINO' ? 'bg-white' : (user.membershipLevel === 'BRONCE' ? 'bg-boston-red' : 'bg-cyan-400'))}`} />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center relative z-10">
        <div>
           <p className="text-boston-gold text-[9px] font-black uppercase tracking-[0.4em] mb-1">VIP PRE-LANZAMIENTO</p>
           <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">{user.firstName}</h1>
        </div>
        <Link href="/profile" className="w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all shadow-xl group">
           <User className="w-6 h-6 text-white/40 group-hover:text-boston-gold transition-colors" />
        </Link>
      </header>

      <main className="px-5 sm:px-6 relative z-10 space-y-10">
        <PWAInstallButton />
        
        <motion.div 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <DigitalCard 
             name={`${user.firstName} ${user.lastName}`}
             qrValue={user.id}
             points={user.points}
             level={user.membershipLevel as any}
             nextTier={calculateNextTier()}
             onClick={() => setShowBenefits(true)}
          />
        </motion.div>

        {/* Info Blocks Row */}
        <section className="space-y-5">
           <div className="bg-boston-red/20 border border-boston-red/50 rounded-3xl p-5 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-2">GRAN LANZAMIENTO</span>
              <p className="text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,59,48,0.8)]">1 DE MAYO</p>
              <p className="text-[10px] text-white/60 font-bold uppercase mt-2 tracking-widest leading-relaxed">Descarga la App ese día para usar tus beneficios.</p>
           </div>
           <div className="grid grid-cols-3 gap-3">
              {/* $1 = 1 PUNTO (Interactive) */}
              <button 
                onClick={() => setShowGuide(true)}
                className="glass-panel p-4 rounded-3xl border border-white/5 bg-white/5 flex flex-col items-center text-center transition-all hover:scale-105 active:scale-95 group"
              >
                  <Flame className="w-6 h-6 mb-3 text-boston-red-glow group-hover:animate-pulse" />
                  <p className="text-[10px] font-black text-white uppercase leading-none tracking-normal">$1 = 1 PUNTO</p>
                  <p className="text-[7px] text-white/40 font-bold uppercase mt-2 tracking-widest">Saber más</p>
              </button>

              {/* CHECK-IN (Active) */}
              <Link 
                href="/claim"
                className="glass-panel p-4 rounded-3xl border border-white/5 bg-white/5 flex flex-col items-center text-center transition-all hover:scale-105 active:scale-95 group"
              >
                  <MapPin className="w-6 h-6 mb-3 text-boston-gold group-hover:animate-bounce transition-transform" />
                  <p className="text-[10px] font-black text-white uppercase leading-none tracking-tighter">Check-in</p>
                  <p className="text-[7px] text-white/40 font-bold uppercase mt-2 tracking-widest">Sumar puntos</p>
              </Link>

              {/* EVENTOS (Linked) */}
              <Link 
                href="/events"
                className="glass-panel p-4 rounded-3xl border border-white/5 bg-white/5 flex flex-col items-center text-center transition-all hover:scale-105 active:scale-95 group"
              >
                  <Ticket className="w-6 h-6 mb-3 text-cyan-400 group-hover:rotate-12 transition-transform" />
                  <p className="text-[10px] font-black text-white uppercase leading-none tracking-tighter">Eventos</p>
                  <p className="text-[7px] text-white/40 font-bold uppercase mt-2 tracking-widest">Ver cartel</p>
              </Link>
           </div>
        </section>

        {/* Quick Actions Re-Designed for Pre-Launch */}
        <div className="space-y-4">
          <div className="relative block group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-boston-gold/50 to-boston-gold/20 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Boston Club',
                    text: `¡Sumate a la lista VIP fundadora de Boston Club conmigo! Usá mi código ${user.referralCode} al registrarte y ganamos puntos los dos.`,
                    url: 'https://mybostonclub.com'
                  });
                } else {
                  navigator.clipboard.writeText(`¡Sumate a la lista VIP fundadora de Boston Club conmigo! Usá mi código ${user.referralCode} al registrarte y ganamos puntos los dos. https://mybostonclub.com`);
                  alert("Código copiado al portapapeles");
                }
              }}
              className="relative glass-panel rounded-[2rem] p-6 flex items-center justify-between border border-boston-gold/30 bg-gradient-to-br from-boston-gold/10 to-transparent hover:bg-boston-gold transition-all duration-500 overflow-hidden cursor-pointer"
            >
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-boston-gold/20 rounded-2xl flex items-center justify-center border border-boston-gold/30 group-hover:bg-black/20 transition-colors">
                      <Gift className="w-7 h-7 text-boston-gold group-hover:text-black" />
                   </div>
                   <div>
                      <h4 className="text-white font-black text-xl italic uppercase tracking-tighter group-hover:text-black transition-colors">Invita y Gana</h4>
                      <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] group-hover:text-black/50 transition-colors">Tu código: <span className="text-boston-gold group-hover:text-black font-black text-xs">{user.referralCode}</span></p>
                   </div>
                </div>
                <ArrowRight className="w-5 h-5 text-boston-gold group-hover:text-black group-hover:translate-x-1 transition-all" />
            </div>
          </div>
          <p className="text-[9px] text-center text-white/30 font-bold uppercase italic tracking-widest px-4">
             Invita amigos hoy y empieza con {user.referralRewardReferrer || 500} pts extra el 1 de mayo.
          </p>
        </div>

        {/* Flash Promo Banners Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {banner && (
              <motion.div 
                key={banner.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.01 }}
                className={`rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl border border-white/10 ${!banner.imageUrl ? 'bg-gradient-to-r from-boston-red to-[#5a0000]' : 'bg-zinc-900'}`}
              >
                {/* Background Image with optimized overlay */}
                {banner.imageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                  </>
                )}

                <div className="absolute right-[-5%] top-[-10%] w-32 h-32 bg-white rounded-full opacity-5 filter blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-center relative z-10">
                    <div className="max-w-[70%]">
                      <span className="bg-white/10 backdrop-blur-md text-white/80 text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full inline-block mb-5 border border-white/10">Novedades</span>
                      <h3 className="text-white font-black text-3xl italic tracking-tighter leading-[0.85] mb-3 uppercase drop-shadow-2xl">
                        {banner.title}
                      </h3>
                      <p className="text-white/60 text-sm font-medium leading-snug line-clamp-2">
                        {banner.description}
                      </p>
                    </div>
                    <div className="shrink-0 w-16 h-16 bg-white/10 rounded-3xl backdrop-blur-3xl flex items-center justify-center border border-white/10 shadow-2xl">
                      <Flame className="w-9 h-9 text-white animate-pulse" />
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Carousel Indicators (Dots) */}
          {banners.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {banners.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentBannerIdx ? 'w-6 bg-boston-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* History Link */}
        <Link href="/history" className="glass-panel p-6 rounded-3xl flex items-center gap-5 hover:bg-white/[0.04] transition-all group bg-white/[0.02] border border-white/5">
           <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all">
             <History className="w-6 h-6" />
           </div>
           <div className="flex-1">
              <p className="text-xs font-black text-white uppercase tracking-[0.3em] mb-1">Actividad</p>
              <p className="text-[10px] text-white/30 font-bold uppercase">Tus puntos y recompensas</p>
           </div>
           <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-boston-gold group-hover:translate-x-1 transition-all" />
        </Link>
      </main>

      {/* Info Modal ($1=1pt Guide) */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             onClick={() => setShowGuide(false)}
           />
           <motion.div 
             initial={{ y: 30, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ duration: 0.3 }}
             className="relative w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-[40px] p-8 overflow-hidden shadow-2xl"
           >
              {/* Modal Background Glow */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-boston-red rounded-full filter blur-[60px] opacity-10" />

              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Guía Boston</h2>
                       <p className="text-[10px] text-boston-gold font-black uppercase tracking-[0.3em] mt-2">Cómo sumar y subir</p>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="text-white/20 hover:text-white transition-colors text-xs font-black">CERRAR</button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Regla de Oro</p>
                       <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4">
                          <Flame className="w-8 h-8 text-boston-red-glow" />
                          <div>
                             <p className="text-xl font-black text-white italic leading-none">$1 = 1 PUNTO</p>
                             <p className="text-[9px] text-white/40 font-bold mt-1 uppercase">Cada peso gastado es un punto para tu cuenta.</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Paso a paso para reclamar</p>
                       <div className="space-y-4">
                          {[
                            { step: "01", text: "Disfruta tu cena o bebida favorita en Boston." },
                            { step: "02", text: "Al pagar, solicita tu ticket con el QR de Boston Club al mozo." },
                            { step: "03", text: "Usa el botón \"CANJEAR QR\" en tu app y escanea el código." }
                          ].map((s, i) => (
                            <div key={i} className="flex gap-4 items-start">
                               <span className="text-boston-gold font-black italic text-xs mt-1">{s.step}</span>
                               <p className="text-[11px] text-white/70 font-medium leading-relaxed uppercase tracking-tight">{s.text}</p>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-white/10">
                       <p className="text-[9px] text-center text-white/30 font-bold uppercase italic font-mono tracking-widest">
                          Sigue sumando para desbloquear beneficios exclusivos
                       </p>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
      {/* Benefits Modal (Click on Card) */}
      {showBenefits && settings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             onClick={() => setShowBenefits(false)}
           />
           <motion.div 
             initial={{ y: "100%" }}
             animate={{ y: 0 }}
             transition={{ duration: 0.4, ease: "circOut" }}
             className="relative w-full max-w-lg bg-[#0d0d0d] border-t sm:border border-white/10 rounded-t-[40px] sm:rounded-[40px] p-8 sm:p-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
           >
              {/* Gold Glow Decor */}
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-boston-gold rounded-full filter blur-[100px] opacity-10 pointer-events-none" />

              <div className="relative z-10 pb-10">
                 <div className="flex justify-between items-start mb-10">
                    <div>
                       <p className="text-boston-gold text-[10px] font-black uppercase tracking-[0.5em] mb-2">Estatus Actual</p>
                       <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Rango {user.membershipLevel}</h2>
                    </div>
                    <button 
                      onClick={() => setShowBenefits(false)} 
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
                    >
                      <ArrowRight className="w-5 h-5 text-white/40 rotate-90" />
                    </button>
                 </div>

                 {/* Benefits Content */}
                 <div className="space-y-10">
                    {/* Current Tier Benefits */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-3">
                          <Crown className="w-5 h-5 text-boston-gold" />
                          <p className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Tus Privilegios Exclusivos</p>
                       </div>
                       
                       <div className="space-y-4">
                          {(settings[`${user.membershipLevel.toLowerCase() === 'bronce' || user.membershipLevel.toLowerCase() === 'bronze' ? 'bronce' : (user.membershipLevel === 'ORO' ? 'gold' : (user.membershipLevel === 'PLATINO' ? 'platinum' : (user.membershipLevel === 'DIAMANTE' ? 'diamond' : 'superVip')))}Benefits`] || "- No hay beneficios configurados").split('\n').map((benefit: string, i: number) => (
                             <motion.div 
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: i * 0.1 }}
                               key={i} 
                               className="flex items-start gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group"
                             >
                                <div className="w-6 h-6 rounded-full bg-boston-gold/10 flex items-center justify-center shrink-0 mt-0.5 border border-boston-gold/20">
                                   <div className="w-1.5 h-1.5 bg-boston-gold rounded-full group-hover:scale-150 transition-transform" />
                                </div>
                                <p className="text-sm text-white/80 font-medium leading-relaxed uppercase tracking-tight italic">{benefit.replace(/^-\s*/, '')}</p>
                             </motion.div>
                          ))}
                       </div>
                    </div>

                    {/* All Tiers Roadmap */}
                    <div className="pt-10 border-t border-white/5 space-y-6">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Próximas Metas</p>
                       <div className="grid grid-cols-1 gap-3">
                          {[
                            { name: "ORO", key: "goldBenefits", icon: "🥇", color: "text-boston-gold" },
                            { name: "PLATINO", key: "platinumBenefits", icon: "💎", color: "text-white" },
                            { name: "DIAMANTE", key: "diamondBenefits", icon: "💠", color: "text-cyan-400" },
                            { name: "SÚPER VIP", key: "superVipBenefits", icon: "🔥", color: "text-boston-red-glow" },
                          ].filter(t => t.name !== user.membershipLevel).map((tier, idx) => (
                             <div key={idx} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                                <div className="flex items-center gap-4">
                                   <span className="text-xl">{tier.icon}</span>
                                   <div>
                                      <p className={`text-xs font-black uppercase tracking-widest ${tier.color}`}>{tier.name}</p>
                                      <p className="text-[9px] text-white/20 font-bold uppercase mt-0.5">Desbloquea más beneficios</p>
                                   </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-white/5 group-hover:text-white group-hover:translate-x-1 transition-all" />
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="mt-12 pt-8 border-t border-white/5 text-center px-4">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] font-mono leading-relaxed italic">
                       Los beneficios están sujetos a términos y condiciones del Boston Club.
                    </p>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

