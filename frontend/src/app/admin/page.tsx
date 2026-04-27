"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Star, ArrowUpRight, ShieldCheck, Ticket, Wallet, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type Redemption = {
  id: string;
  description: string;
  userName: string;
  points: number;
  createdAt: string;
};

type Stats = {
  totalUsers: number;
  totalPointsUsed: number;
  totalPointsBalance: number;
  latestActivity: Redemption[];
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Card 1: Users */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-boston-red/10 rounded-2xl">
              <Users className="w-6 h-6 text-boston-red-glow" />
            </div>
            <Link href="/admin/users" className="p-2 hover:bg-white/5 rounded-full transition-all opacity-0 group-hover:opacity-100">
               <ArrowRight className="w-4 h-4 text-white/20" />
            </Link>
          </div>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Usuarios Totales</p>
          <p className="text-4xl font-black text-white italic tracking-tighter leading-none">
            {loading ? "..." : stats?.totalUsers.toLocaleString()}
          </p>
          <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-boston-red-glow rounded-full mix-blend-screen filter blur-[50px] opacity-10" />
        </motion.div>

        {/* Stat Card 2: Points Used */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-[2rem] border border-white/5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-boston-gold/10 rounded-2xl">
              <Star className="w-6 h-6 text-boston-gold" />
            </div>
          </div>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Puntos Canjeados</p>
          <p className="text-4xl font-black text-white italic tracking-tighter leading-none">
            {loading ? "..." : formatPoints(stats?.totalPointsUsed || 0)}
          </p>
          <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-boston-gold rounded-full mix-blend-screen filter blur-[50px] opacity-10" />
        </motion.div>

        {/* Stat Card 3: Unredeemed Points */}
        <Link href="/admin/users" className="block">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-[2rem] border border-white/5 relative overflow-hidden hover:border-boston-gold/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-green-500/10 rounded-2xl">
                <Wallet className="w-6 h-6 text-green-500" />
              </div>
              <div className="p-2 bg-white/5 rounded-full group-hover:bg-boston-gold group-hover:text-black transition-all">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Puntos Sin Canjear</p>
            <p className="text-4xl font-black text-white italic tracking-tighter leading-none">
              {loading ? "..." : formatPoints(stats?.totalPointsBalance || 0)}
            </p>
            <p className="text-[9px] text-white/20 font-black uppercase mt-4 tracking-widest group-hover:text-boston-gold/50 transition-all">Ver detalle por usuario</p>
            <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-green-500 rounded-full mix-blend-screen filter blur-[50px] opacity-10" />
          </motion.div>
        </Link>
      </div>

      <div className="mt-8 glass-panel p-10 rounded-[2.5rem] border border-white/5 min-h-[350px]">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-boston-red-glow w-6 h-6"/>
              <h3 className="text-white font-black tracking-widest uppercase italic text-lg">Actividad Reciente</h3>
            </div>
            <Link href="/admin/users" className="text-[10px] text-white/30 font-black uppercase tracking-widest hover:text-white transition-all">Ver historial completo</Link>
         </div>
         
         {loading ? (
           <div className="space-y-4 animate-pulse">
             {[1, 2, 3].map(i => (
               <div key={i} className="h-20 bg-white/5 rounded-[1.5rem] border border-white/5" />
             ))}
           </div>
         ) : (
           <div className="space-y-3">
               {stats?.latestActivity && stats.latestActivity.length > 0 ? (
                stats.latestActivity.map((r) => (
                  <div key={r.id} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-[1.5rem] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${r.points < 0 ? 'text-boston-red-glow bg-boston-red/10 group-hover:scale-110' : 'text-green-500 bg-green-500/10 group-hover:scale-110'}`}>
                        <Ticket className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm tracking-tight uppercase italic">{r.description}</p>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1">{r.userName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-xs block tracking-widest ${r.points < 0 ? 'text-boston-red-glow' : 'text-green-500'}`}>
                        {r.points > 0 ? '+' : ''}{r.points} PTS
                      </span>
                      <span className="text-white/20 text-[9px] uppercase font-black tracking-tighter mt-1 block">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-white/10 uppercase font-black tracking-[0.4em] text-xs">
                  No hay actividad registrada aún
                </div>
              )}
           </div>
         )}
      </div>
    </div>
  );
}
