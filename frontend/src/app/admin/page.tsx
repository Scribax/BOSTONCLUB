"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Star, ArrowUpRight, ShieldCheck, Ticket } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Redemption = {
  id: string;
  rewardName: string;
  userName: string;
  points: number;
  createdAt: string;
};

type Stats = {
  totalUsers: number;
  totalPointsUsed: number;
  latestRedemptions: Redemption[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await apiFetch("/admin/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const formatPoints = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-widest uppercase">Estadísticas</h1>
        <p className="text-white/50 text-sm">Resumen general del club</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Stat Card 1: Users */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-boston-red/10 rounded-lg">
              <Users className="w-5 h-5 text-boston-red-glow" />
            </div>
          </div>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Usuarios</p>
          <p className="text-3xl font-black text-white">
            {loading ? "..." : stats?.totalUsers.toLocaleString()}
          </p>
          <div className="absolute bottom-[-20%] right-[-10%] w-24 h-24 bg-boston-red-glow rounded-full mix-blend-screen filter blur-[40px] opacity-10" />
        </motion.div>

        {/* Stat Card 2: Points Used */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-boston-gold/10 rounded-lg">
              <Star className="w-5 h-5 text-boston-gold" />
            </div>
          </div>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Puntos Usados</p>
          <p className="text-3xl font-black text-white">
            {loading ? "..." : formatPoints(stats?.totalPointsUsed || 0)}
          </p>
          <div className="absolute bottom-[-20%] right-[-10%] w-24 h-24 bg-boston-gold rounded-full mix-blend-screen filter blur-[40px] opacity-10" />
        </motion.div>
      </div>

      <div className="mt-8 glass-panel p-6 rounded-2xl border border-white/5 min-h-[300px]">
         <div className="flex items-center gap-2 mb-6">
           <ShieldCheck className="text-boston-red-glow w-5 h-5"/>
           <h3 className="text-white font-bold tracking-widest uppercase">Actividad Reciente</h3>
         </div>
         
         {loading ? (
           <div className="space-y-4 animate-pulse">
             {[1, 2, 3].map(i => (
               <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/5" />
             ))}
           </div>
         ) : (
           <div className="space-y-4">
              {stats?.latestRedemptions && stats.latestRedemptions.length > 0 ? (
                stats.latestRedemptions.map((r) => (
                  <div key={r.id} className="flex justify-between items-center bg-[#0a0a0a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.points < 0 ? 'text-boston-red-glow bg-boston-red/10' : 'text-green-500 bg-green-500/10'}`}>
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm tracking-tight">{r.rewardName}</p>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">{r.userName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-xs block ${r.points < 0 ? 'text-boston-red-glow' : 'text-green-500'}`}>
                        {r.points > 0 ? '+' : ''}{r.points} PTS
                      </span>
                      <span className="text-white/20 text-[9px] uppercase tracking-tighter mt-1 block">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-white/20 uppercase font-black tracking-widest text-xs">
                  No hay actividad registrada aún
                </div>
              )}
           </div>
         )}
      </div>
    </div>
  );
}
