"use client";

import { motion } from "framer-motion";
import { ArrowLeft, History, ArrowUpRight, ArrowDownRight, Gift, ShoppingBag, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Movement = {
  id: string;
  pointsGained: number;
  source: string;
  description: string;
  createdAt: string;
};

export default function HistoryPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await apiFetch("/points/history");
        setMovements(data);
      } catch (err) {
        console.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const getSourceIcon = (source: string, amount: number) => {
    if (amount < 0) return <ShoppingBag className="w-5 h-5 text-boston-red-glow" />;
    switch (source) {
      case "PURCHASE": return <CreditCard className="w-5 h-5 text-boston-gold" />;
      case "QR_CHECKIN": return <Sparkles className="w-5 h-5 text-boston-gold" />;
      case "BIRTHDAY": return <Gift className="w-5 h-5 text-boston-gold" />;
      default: return <History className="w-5 h-5 text-white/50" />;
    }
  };

  return (
    <div className="min-h-screen bg-boston-black pb-12">
      {/* Glow effect */}
      <div className="fixed top-[-10%] right-[-10%] w-80 h-80 bg-boston-red rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none" />

      <header className="px-6 pt-8 pb-4 flex items-center gap-4 relative z-10">
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight italic">Mis Movimientos</h1>
      </header>

      <main className="px-6 pt-6 relative z-10">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-3xl border border-white/5" />
            ))}
          </div>
        ) : movements.length > 0 ? (
          <div className="space-y-4">
            {movements.map((m, index) => (
              <motion.div 
                key={m.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.pointsGained < 0 ? 'bg-boston-red/10' : 'bg-boston-gold/10'}`}>
                    {getSourceIcon(m.source, m.pointsGained)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{m.description || "Movimiento de puntos"}</p>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(m.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {m.pointsGained > 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-boston-red" />
                    )}
                    <span className={`font-black text-lg ${m.pointsGained > 0 ? 'text-green-500' : 'text-boston-red'}`}>
                      {m.pointsGained > 0 ? '+' : ''}{m.pointsGained}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Puntos</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <History className="w-16 h-16 mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.2em]">Sin movimientos aún</p>
          </div>
        )}
      </main>
    </div>
  );
}
