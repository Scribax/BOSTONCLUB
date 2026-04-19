"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Gift, Star, Ticket, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type Reward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: string;
};

export default function RewardsPage() {
  const router = useRouter();
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, rewardsData] = await Promise.all([
        apiFetch("/auth/me"),
        apiFetch("/rewards")
      ]);
      setUserPoints(userData.points);
      setRewards(rewardsData);
    } catch (err) {
      console.error("Error loading rewards data", err);
      setUserPoints(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (confirm(`¿Canjear ${reward.name} por ${reward.pointsRequired} puntos?`)) {
      setRedeemingId(reward.id);
      try {
        const data = await apiFetch("/redemptions/generate", {
          method: "POST",
          body: JSON.stringify({ rewardId: reward.id })
        });
        // Redirect to QR page with the token
        router.push(`/rewards/qr?token=${data.qrToken}&reward=${encodeURIComponent(reward.name)}`);
      } catch (err: any) {
        alert(err.message || "Error al procesar el canje");
      } finally {
        setRedeemingId(null);
      }
    }
  };

  const pts = userPoints ?? 0;
  const isDataLoading = userPoints === null || loading;

  return (
    <div className="min-h-screen bg-boston-black pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-4 py-4 flex items-center gap-4 bg-boston-black/80 backdrop-blur-xl">
        <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <h2 className="text-white text-lg font-bold tracking-tight">Catálogo de Premios</h2>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] text-white/50 uppercase tracking-widest leading-none mb-1">Tus Puntos</span>
          <span className="text-boston-gold font-black text-sm px-2 py-0.5 bg-boston-gold/10 rounded-full border border-boston-gold/20 flex items-center gap-1">
            <Star className="w-3 h-3 fill-boston-gold" />
            {isDataLoading ? "..." : pts}
          </span>
        </div>
      </header>

      <main className="px-6 pt-6">
        <div className="mb-6 bg-gradient-to-br from-boston-red/20 to-transparent p-5 rounded-2xl border border-boston-red/20">
           <Gift className="w-8 h-8 text-boston-red-glow mb-2" />
           <h3 className="text-white font-bold text-lg leading-tight">Canjea tus puntos<br/>por experiencias.</h3>
           <p className="text-white/60 text-xs mt-2">Acércate a la barra, muestra tu QR generado y disfruta.</p>
        </div>

        {isDataLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {!isDataLoading && rewards.map((reward, idx) => {
            const canRedeem = pts >= reward.pointsRequired;
            const isRedeeming = redeemingId === reward.id;

            return (
              <motion.div 
                key={reward.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-panel p-4 rounded-2xl flex items-center gap-4 border transition-all ${canRedeem ? 'border-white/10 hover:border-boston-gold/50 cursor-pointer' : 'border-white/5 opacity-50 grayscale'}`}
              >
                <div className="w-16 h-16 bg-[#111] rounded-xl flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  {reward.type === 'BEBIDA' ? '🍺' : reward.type === 'COMIDA' ? '🍔' : '🎫'}
                </div>
                <div className="flex-1">
                  <span className="text-[9px] text-boston-red-glow font-black uppercase tracking-widest">{reward.type}</span>
                  <h4 className="text-white font-bold text-base leading-tight mt-0.5">{reward.name}</h4>
                  <div className="flex items-center gap-1 mt-1 opacity-80">
                     <Ticket className="w-3 h-3 text-boston-gold" />
                     <span className="text-boston-gold font-black text-xs">{reward.pointsRequired} PTS</span>
                  </div>
                  {!canRedeem && (
                    <p className="text-white/30 text-[10px] mt-1">Te faltan {reward.pointsRequired - pts} pts</p>
                  )}
                </div>
                <div>
                  <button 
                    disabled={!canRedeem || isRedeeming}
                    onClick={() => handleRedeem(reward)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${canRedeem ? 'bg-white text-black hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                  >
                    {isRedeeming ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Canjear'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {!isDataLoading && rewards.length === 0 && (
          <p className="text-center text-white/20 uppercase font-black tracking-widest text-[10px] mt-20">
            No hay premios cargados en el catálogo aún.
          </p>
        )}
      </main>
    </div>
  );
}
