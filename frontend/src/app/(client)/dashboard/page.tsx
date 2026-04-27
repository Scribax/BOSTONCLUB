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

      <main className="px-5 sm:px-6 relative z-10 space-y-10 pb-12">
        
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

        {/* Waitlist Grand Launch Info */}
        <section className="space-y-4">
           <div className="bg-gradient-to-b from-boston-red/30 to-transparent border border-boston-red/50 rounded-[2.5rem] p-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-boston-red/50 blur-[50px] rounded-full pointer-events-none" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-3 relative z-10">GRAN LANZAMIENTO</span>
              <p className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,59,48,0.8)] relative z-10">1 DE MAYO</p>
              <div className="mt-6 space-y-3 relative z-10">
                <p className="text-xs text-white/80 font-bold uppercase tracking-widest leading-relaxed">
                  Ese día recibirás en tu correo el link oficial para descargar la app en <span className="text-white">iOS y Android</span>.
                </p>
              </div>
           </div>
        </section>

        {/* Quick Actions Re-Designed for Pre-Launch */}
        <div className="space-y-6">
          <div className="text-center px-4">
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Acumula Puntos Hoy</h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Gana {user.referralRewardReferrer || 500} pts por cada amigo que invites a la lista VIP.</p>
          </div>

          <div className="relative block group">
            <div className="absolute -inset-1 bg-gradient-to-r from-boston-gold/50 via-boston-gold/20 to-boston-gold/50 rounded-[2.5rem] blur opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
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
              className="relative bg-[#111]/90 backdrop-blur-xl rounded-[2.5rem] p-8 flex items-center justify-between border border-boston-gold/50 hover:bg-boston-gold/10 transition-all duration-500 overflow-hidden cursor-pointer shadow-2xl"
            >
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-gradient-to-br from-boston-gold to-boston-gold/40 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-500">
                      <Gift className="w-8 h-8 text-black" />
                   </div>
                   <div>
                      <h4 className="text-white font-black text-2xl italic uppercase tracking-tighter group-hover:text-boston-gold transition-colors">Compartir Código</h4>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] mt-1">
                        Tu código VIP: <span className="text-boston-gold font-black text-sm ml-1 bg-boston-gold/10 px-2 py-0.5 rounded">{user.referralCode}</span>
                      </p>
                   </div>
                </div>
                <ArrowRight className="w-6 h-6 text-boston-gold group-hover:translate-x-2 transition-all" />
            </div>
          </div>
        </div>

        {/* Steps Info */}
        <div className="pt-6 border-t border-white/5 space-y-6">
           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] text-center">¿Cómo funcionará la App?</p>
           <div className="space-y-4">
              {[
                { step: "01", title: "Descarga", text: "El 1 de mayo, instala la app desde la tienda oficial." },
                { step: "02", title: "Escanea", text: "Usa tu celular en caja para escanear el QR y ganar puntos." },
                { step: "03", title: "Disfruta", text: "Canjea tus puntos por recompensas exclusivas." }
              ].map((s, i) => (
                <div key={i} className="flex gap-4 items-center bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
                   <span className="text-boston-gold font-black italic text-xl w-8 shrink-0">{s.step}</span>
                   <div>
                     <p className="text-xs text-white font-black uppercase tracking-widest">{s.title}</p>
                     <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-relaxed mt-0.5">{s.text}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </main>


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

