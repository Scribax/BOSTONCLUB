"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Star, ArrowUpRight, ShieldCheck, Ticket, Wallet, ArrowRight, Send, BellRing } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  chartData: any[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Push Campaign State
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushAudience, setPushAudience] = useState("ALL");
  const [pushLoading, setPushLoading] = useState(false);

  const handleSendPush = async () => {
    if (!pushTitle || !pushBody) return alert("Completa título y mensaje");
    if (!confirm("¿Estás seguro de enviar esta campaña a los dispositivos?")) return;
    
    setPushLoading(true);
    try {
      const res = await apiFetch("/admin/push", {
        method: "POST",
        body: JSON.stringify({ title: pushTitle, body: pushBody, audience: pushAudience })
      });
      alert(res.message || "Campaña enviada con éxito");
      setPushTitle("");
      setPushBody("");
    } catch (err: any) {
      alert("Error al enviar: " + (err.message || "Error desconocido"));
    } finally {
      setPushLoading(false);
    }
  };

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

      {/* Chart Section */}
      <div className="mt-8 glass-panel p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-white font-black tracking-widest uppercase italic text-lg">Flujo de Puntos</h3>
            <p className="text-white/40 text-xs mt-1">Puntos Entregados vs Canjeados (Últimos 7 días)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-boston-gold" />
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Entregados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-boston-red-glow" />
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Canjeados</span>
            </div>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full animate-pulse bg-white/5 rounded-2xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntregados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCanjeados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF2D2D" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF2D2D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? (val/1000)+'k' : val} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 4, textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="entregados" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorEntregados)" />
                <Area type="monotone" dataKey="canjeados" stroke="#FF2D2D" strokeWidth={3} fillOpacity={1} fill="url(#colorCanjeados)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
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

      {/* Export Section */}
      <div className="mt-8 glass-panel p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-black tracking-widest uppercase text-lg mb-1">Exportar Auditoría</h3>
            <p className="text-white/40 text-xs">Descarga todos los movimientos en formato Excel/CSV</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-black text-white/30 tracking-widest">Desde</span>
              <input 
                type="date" 
                id="startDate"
                className="bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-boston-gold transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-black text-white/30 tracking-widest">Hasta</span>
              <input 
                type="date" 
                id="endDate"
                className="bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-boston-gold transition-colors"
              />
            </div>
            
            <button 
              onClick={async () => {
                const startDate = (document.getElementById('startDate') as HTMLInputElement).value;
                const endDate = (document.getElementById('endDate') as HTMLInputElement).value;
                
                try {
                  const token = localStorage.getItem("boston_club_token");
                  let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/admin/export`;
                  if (startDate && endDate) {
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                  }
                  
                  const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  if (!response.ok) throw new Error("Error exporting");
                  
                  const blob = await response.blob();
                  const downloadUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = downloadUrl;
                  a.download = `auditoria_movimientos_${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(downloadUrl);
                } catch (err) {
                  console.error(err);
                  alert("Error al exportar los datos.");
                }
              }}
              className="w-full sm:w-auto bg-boston-gold text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all flex justify-center items-center gap-2"
            >
              <Ticket className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Push Campaigns Section */}
      <div className="mt-8 glass-panel p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-boston-gold rounded-full opacity-5 blur-[100px]" />
        
        <div className="flex items-center gap-3 mb-8">
          <BellRing className="text-boston-gold w-6 h-6"/>
          <div>
            <h3 className="text-white font-black tracking-widest uppercase text-lg">Campañas Push</h3>
            <p className="text-white/40 text-xs">Envía notificaciones personalizadas a los socios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-4">
            <div>
               <label className="text-[10px] uppercase font-black text-white/30 tracking-widest block mb-2">Título de la Notificación</label>
               <input 
                 type="text" 
                 value={pushTitle}
                 onChange={e => setPushTitle(e.target.value)}
                 placeholder="Ej: 🔥 ¡Happy Hour Sorpresa!"
                 className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-boston-gold transition-colors"
                 maxLength={50}
               />
            </div>
            <div>
               <label className="text-[10px] uppercase font-black text-white/30 tracking-widest block mb-2">Mensaje</label>
               <textarea 
                 value={pushBody}
                 onChange={e => setPushBody(e.target.value)}
                 placeholder="Escribe el mensaje corto aquí..."
                 className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-boston-gold transition-colors h-24 resize-none"
                 maxLength={150}
               />
               <p className="text-right text-[9px] text-white/20 mt-1">{pushBody.length}/150</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] uppercase font-black text-white/30 tracking-widest block mb-2">Público Objetivo</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setPushAudience("ALL")}
                  className={`flex-1 py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${pushAudience === "ALL" ? 'bg-boston-gold/10 border-boston-gold text-boston-gold' : 'bg-black/50 border-white/10 text-white/40 hover:border-white/30'}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setPushAudience("VIP")}
                  className={`flex-1 py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${pushAudience === "VIP" ? 'bg-white/10 border-white text-white' : 'bg-black/50 border-white/10 text-white/40 hover:border-white/30'}`}
                >
                  <Star className="w-3 h-3" /> Solo VIPs
                </button>
              </div>
              <p className="text-[9px] text-white/30 mt-3 italic">
                {pushAudience === "ALL" ? "Se enviará a todos los socios con la app instalada." : "Se enviará solo a niveles Oro, Platino, Diamante y Súper VIP."}
              </p>
            </div>

            <button 
              onClick={handleSendPush}
              disabled={pushLoading || !pushTitle || !pushBody}
              className="w-full bg-boston-gold text-black px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pushLoading ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-5 h-5" /> Lanzar Campaña
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
