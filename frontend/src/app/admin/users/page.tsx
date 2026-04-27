"use client";

import { useState, useEffect } from "react";
import { Search, Award, ArrowUpDown, Trash2, Ban, CheckCircle2, Crown, MessageCircle, Download, CheckSquare, History, Clock, Ticket, Star, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';

type User = {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  points: number;
  role: string;
  isBlocked: boolean;
  membershipLevel: string;
  vipRewardSentAt: string | null;
  birthDate: string | null;
  referralCode: string | null;
  _count: {
    referrals: number;
  };
};

type HistoryItem = {
  id: string;
  pointsGained: number;
  description: string;
  source: string;
  createdAt: string;
};

type RedemptionItem = {
  id: string;
  status: string;
  createdAt: string;
  reward?: { name: string };
  event?: { title: string };
};

const calculateAge = (birthDateString: string | null) => {
  if (!birthDateString) return null;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "dni" | "points">("name");
  const [ageFilter, setAgeFilter] = useState("ALL");
  const [vipSettings, setVipSettings] = useState<any>(null);
  
  // Point Adjustment States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointsDelta, setPointsDelta] = useState<string>("");
  const [pointMode, setPointMode] = useState<"increment" | "set">("increment");
  const [pointReason, setPointReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // History States
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [historyData, setHistoryData] = useState<{ history: HistoryItem[], redemptions: RedemptionItem[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Referrals State
  const [referralUser, setReferralUser] = useState<User | null>(null);
  const [referralData, setReferralData] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sort]);

  const fetchReferrals = async (user: User) => {
    if (user._count.referrals === 0) return;
    setReferralUser(user);
    setLoadingReferrals(true);
    try {
      const data = await apiFetch(`/users/${user.id}/referrals`);
      setReferralData(data);
    } catch (err) {
      console.error("Error fetching referrals", err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, settingsData] = await Promise.all([
        apiFetch(`/users?search=${search}&sort=${sort}`),
        apiFetch("/settings")
      ]);
      setUsers(usersData);
      setVipSettings(settingsData);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (user: User) => {
    setHistoryUser(user);
    setLoadingHistory(true);
    try {
      const data = await apiFetch(`/users/${user.id}/history`);
      setHistoryData(data);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const toggleBlock = async (id: string) => {
    try {
      await apiFetch(`/users/${id}/block`, { method: "PATCH" });
      setUsers(users.map(u => u.id === id ? { ...u, isBlocked: !u.isBlocked } : u));
    } catch (err) {
      alert("Error al cambiar estado de bloqueo");
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Estás seguro de eliminar a ${user.firstName} ${user.lastName}? Esta acción es irreversible.`)) return;
    try {
      await apiFetch(`/users/${user.id}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== user.id));
    } catch (err) {
      alert("Error al eliminar usuario");
    }
  };

  const handleAdjustPoints = async () => {
    const delta = parseInt(pointsDelta);
    if (!selectedUser || !delta || isNaN(delta)) return;
    setIsAdjusting(true);
    try {
      const data = await apiFetch(`/users/${selectedUser.id}/points`, {
        method: "PATCH",
        body: JSON.stringify({ 
          points: delta, 
          reason: pointReason,
          mode: pointMode
        })
      });
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, points: data.points, membershipLevel: data.level } : u));
      setSelectedUser(null);
      setPointsDelta("");
      setPointMode("increment");
      setPointReason("");
    } catch (err) {
      alert("Error al ajustar puntos");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const exportToExcel = () => {
    const usersToExport = selectedIds.length > 0 
      ? users.filter(u => selectedIds.includes(u.id))
      : users;

    const data = usersToExport.map(u => ({
      "Nombre Completo": `${u.firstName} ${u.lastName}`.toUpperCase(),
      "DNI": u.dni,
      "Email": u.email,
      "WhatsApp": u.whatsapp,
      "Rango": u.membershipLevel,
      "Puntos": u.points,
      "Edad": calculateAge(u.birthDate) || "Desconocida",
      "Fecha Nacimiento": u.birthDate ? new Date(u.birthDate).toLocaleDateString() : "No reg.",
      "Estado": u.isBlocked ? "BLOQUEADO" : "ACTIVO",
      "Rol": u.role,
      "ID Sistema": u.id
    }));

    const wb = XLSX.utils.book_new();
    const wsAll = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, wsAll, "TODOS LOS SOCIOS");
    const levels = ["BRONCE", "ORO", "PLATINO", "DIAMANTE", "SÚPER VIP"];
    levels.forEach(level => {
      const levelData = data.filter(d => d.Rango === level);
      if (levelData.length > 0) {
        const wsLevel = XLSX.utils.json_to_sheet(levelData);
        XLSX.utils.book_append_sheet(wb, wsLevel, level);
      }
    });
    const fileName = `BostonClub_Socios_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const filteredUsers = users.filter(u => {
    const age = calculateAge(u.birthDate);
    if (ageFilter === "ALL") return true;
    if (ageFilter === "UNKNOWN") return age === null;
    if (age === null) return false;
    if (ageFilter === "UNDER_18") return age < 18;
    if (ageFilter === "18_25") return age >= 18 && age <= 25;
    if (ageFilter === "26_35") return age >= 26 && age <= 35;
    if (ageFilter === "OVER_35") return age > 35;
    return true;
  });

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">Gestión de Usuarios</h1>
          <p className="text-white/50 text-sm">Administra socios, puntos y accesos al club.</p>
        </div>
        
        <div className="flex gap-2 flex-col md:flex-row md:items-center">
           <button 
             onClick={exportToExcel}
             className="flex items-center gap-2 bg-boston-gold text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-boston-gold/10"
           >
             <Download className="w-3 h-3" /> 
             {selectedIds.length > 0 ? `Exportar (${selectedIds.length})` : "Exportar Todo"}
           </button>

           <select 
             value={ageFilter} 
             onChange={(e) => setAgeFilter(e.target.value)}
             className="bg-[#0a0a0a] text-white border border-white/10 rounded-xl py-2 px-4 focus:border-boston-gold transition-colors outline-none text-[10px] font-black uppercase tracking-widest"
           >
             <option value="ALL">Todas las edades</option>
             <option value="UNDER_18">Menores (-18)</option>
             <option value="18_25">18 a 25 años</option>
             <option value="26_35">26 a 35 años</option>
             <option value="OVER_35">Más de 35</option>
             <option value="UNKNOWN">Sin edad registrada</option>
           </select>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                type="text" 
                placeholder="Buscar por DNI o Nombre..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#0a0a0a] text-white border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:border-boston-gold transition-colors outline-none w-full md:w-64 text-sm"
              />
            </div>
            <button type="submit" className="bg-white text-black px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-white/90">
              Buscar
            </button>
          </form>
        </div>
      </header>

      <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
        <button 
          onClick={() => setSort("name")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${sort === "name" ? "bg-boston-gold text-black" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
        >
          <ArrowUpDown className="w-3 h-3" /> Por Nombre A-Z
        </button>
        <button 
          onClick={() => setSort("points")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${sort === "points" ? "bg-boston-gold text-black" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
        >
          <Crown className="w-3 h-3" /> Top Puntos
        </button>
        <button 
          onClick={() => setSort("dni")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${sort === "dni" ? "bg-boston-gold text-black" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
        >
          <ArrowUpDown className="w-3 h-3" /> Por DNI
        </button>
      </div>

      <div className="glass-panel p-4 rounded-3xl border border-white/5 overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-white/30 animate-pulse">Cargando base de datos...</div>
        ) : (
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                <th className="pb-4 pl-4 w-10">
                   <input 
                     type="checkbox" 
                     className="accent-boston-gold cursor-pointer"
                     checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                     onChange={handleSelectAll}
                   />
                </th>
                <th className="pb-4">Socio</th>
                <th className="pb-4">DNI / Email</th>
                <th className="pb-4 text-center">Puntos</th>
                <th className="pb-4 text-center">Nivel</th>
                <th className="pb-4 text-center">Referidos</th>
                <th className="pb-4 text-center">Estado</th>
                <th className="pb-4 text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isVip = vipSettings && u.points >= vipSettings.vipThreshold;
                const wasSent = Boolean(u.vipRewardSentAt);
                const isSelected = selectedIds.includes(u.id);
                
                const sendWhatsAppReward = async () => {
                  if (!vipSettings) return;
                  const message = vipSettings.vipMessageTemplate
                    .replace("{name}", u.firstName)
                    .replace("{points}", u.points.toString()) + "\n\n" + vipSettings.rewardListText;
                  const encodedMsg = encodeURIComponent(message);
                  window.open(`https://wa.me/${u.whatsapp}?text=${encodedMsg}`, "_blank");

                  if (!wasSent) {
                    try {
                      const res = await apiFetch(`/users/${u.id}/reward-status`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: true })
                      });
                      setUsers(prev => prev.map(user => user.id === u.id ? { ...user, vipRewardSentAt: res.vipRewardSentAt } : user));
                    } catch (err) {
                      console.error("Error marking as sent", err);
                    }
                  }
                };

                const resetVipStatus = async () => {
                  if (!confirm(`¿Deseas resetear el estado de premio para ${u.firstName}? Volverá a aparecer como "Pendiente".`)) return;
                  try {
                    await apiFetch(`/users/${u.id}/reward-status`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: false })
                    });
                    setUsers(prev => prev.map(user => user.id === u.id ? { ...user, vipRewardSentAt: null } : user));
                  } catch (err) {
                    alert("Error al resetear estado");
                  }
                };

                return (
                  <tr key={u.id} className={`border-b border-white/5 last:border-0 transition-all group ${isSelected ? 'bg-boston-gold/5' : (wasSent ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]' : 'hover:bg-white/5')}`}>
                    <td className="py-5 pl-4">
                       <input 
                         type="checkbox" 
                         className="accent-boston-gold cursor-pointer"
                         checked={isSelected}
                         onChange={() => toggleSelect(u.id)}
                       />
                    </td>
                    <td className="py-5 uppercase">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#222] to-black border border-white/10 flex items-center justify-center text-white/60 font-black text-sm uppercase relative">
                          {u.firstName[0]}{u.lastName[0]}
                          {isVip && (
                            <div className="absolute -top-1 -right-1">
                              <Crown className={`w-4 h-4 ${wasSent ? 'text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-boston-gold fill-boston-gold shadow-lg shadow-boston-gold'}`} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`text-white font-bold flex items-center gap-2 ${wasSent ? 'text-emerald-400/90' : ''}`}>
                            {u.firstName} {u.lastName}
                            {isVip && <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${wasSent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-boston-gold/20 text-boston-gold'}`}>VIP</span>}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'text-boston-red-glow' : 'text-white/30'}`}>
                              {u.role}
                            </span>
                            {wasSent && (
                              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-2.5 h-2.5" /> ENVIADO
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-5">
                      <p className="text-white/80 text-sm font-medium">{u.dni}</p>
                      <p className="text-white/30 text-[10px] mb-1">{u.email}</p>
                      {u.birthDate ? (
                        <p className="text-boston-gold/80 text-[10px] font-black uppercase tracking-widest">{calculateAge(u.birthDate)} Años</p>
                      ) : (
                        <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Edad Desconocida</p>
                      )}
                    </td>
                    <td className="py-5 text-center">
                      <span className={`font-black text-sm ${isVip && !wasSent ? 'text-boston-gold drop-shadow-[0_0_8px_rgba(204,166,80,0.5)]' : (wasSent ? 'text-emerald-500/70' : 'text-white/80')}`}>
                        {u.points}
                      </span>
                    </td>
                    <td className="py-5 text-center">
                      <span className="text-[10px] font-black bg-white/5 text-white/60 px-2 py-1 rounded border border-white/5">
                        {u.membershipLevel}
                      </span>
                    </td>
                    <td className="py-5 text-center">
                      <button 
                        onClick={() => fetchReferrals(u)}
                        className={`text-[10px] font-black px-3 py-1 rounded-full transition-all ${u._count.referrals > 0 ? 'bg-boston-gold/10 text-boston-gold hover:bg-boston-gold hover:text-black border border-boston-gold/20' : 'bg-white/5 text-white/20 border border-white/5 cursor-default'}`}
                      >
                        {u._count.referrals} {u._count.referrals === 1 ? 'Invitado' : 'Invitados'}
                      </button>
                    </td>
                    <td className="py-5 text-center">
                      {u.isBlocked ? (
                        <span className="flex items-center justify-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest">
                          <Ban className="w-3 h-3" /> Bloqueado
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </td>
                    <td className="py-5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => fetchHistory(u)}
                          title="Ver Historial"
                          className="bg-white/5 text-white/50 hover:bg-white/10 hover:text-white p-2 rounded-lg transition-all"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {isVip && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={sendWhatsAppReward}
                              title="Enviar Recompensa VIP"
                              className={`${wasSent ? 'bg-white/5 text-white/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'} p-2 rounded-lg transition-all`}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            {wasSent && (
                              <button 
                                onClick={resetVipStatus}
                                title="Resetear Estado de Premio"
                                className="bg-white/5 text-white/30 hover:bg-white/20 hover:text-white p-2 rounded-lg transition-all"
                              >
                                <ArrowUpDown className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                        <button 
                          onClick={() => setSelectedUser(u)}
                          title="Ajustar Puntos"
                          className="bg-boston-gold/10 text-boston-gold hover:bg-boston-gold hover:text-black p-2 rounded-lg transition-all"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleBlock(u.id)}
                          title={u.isBlocked ? "Desbloquear" : "Bloquear"}
                          className={`${u.isBlocked ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'} p-2 rounded-lg transition-all`}
                        >
                          {u.isBlocked ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(u)}
                          title="Eliminar Usuario"
                          className="bg-white/5 text-white/30 hover:bg-white/10 hover:text-white p-2 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}


              {(!loading && filteredUsers.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/20 uppercase font-black tracking-widest text-xs">
                    No se encontraron usuarios bajo este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Point Adjustment Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0c0c0c] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
            >
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Ajustar Puntos</h3>
              <p className="text-white/50 text-xs mb-6 uppercase tracking-widest font-bold">
                Usuario: <span className="text-boston-gold">{selectedUser.firstName} {selectedUser.lastName}</span>
              </p>

              <div className="flex bg-black p-1 rounded-xl mb-6 border border-white/5">
                <button 
                  onClick={() => setPointMode("increment")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${pointMode === 'increment' ? 'bg-boston-gold text-black shadow-lg shadow-boston-gold/20' : 'text-white/40 hover:text-white'}`}
                >
                  Sumar / Restar
                </button>
                <button 
                  onClick={() => setPointMode("set")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${pointMode === 'set' ? 'bg-boston-gold text-black shadow-lg shadow-boston-gold/20' : 'text-white/40 hover:text-white'}`}
                >
                  Establecer Fijo
                </button>
              </div>

              <div className="space-y-6">
                {pointMode === 'increment' && (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                     <p className="text-[10px] text-boston-gold font-black uppercase tracking-widest text-center">Calculadora $1 = 1 Punto</p>
                     <div>
                        <label className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-2 block">Importe de la Cuenta ($)</label>
                        <input 
                          type="number" 
                          placeholder="Ingresa el gasto total..."
                          onChange={(e) => setPointsDelta(e.target.value)}
                          className="w-full bg-black/60 text-white border border-white/5 rounded-xl py-3 px-4 text-lg font-bold focus:border-boston-gold transition-all outline-none"
                        />
                     </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-3 block">
                    {pointMode === 'set' ? 'Nuevo saldo de puntos' : 'Puntos finales a procesar'}
                  </label>
                  <input 
                    type="number" 
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(e.target.value)}
                    placeholder={pointMode === 'set' ? selectedUser.points.toString() : "0"}
                    className="w-full bg-black text-white border border-white/10 rounded-2xl py-4 px-6 text-2xl font-black focus:border-boston-gold transition-all outline-none shadow-lg shadow-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-3 block">Motivo (Opcional)</label>
                  <input 
                    type="text" 
                    value={pointReason}
                    onChange={(e) => setPointReason(e.target.value)}
                    placeholder="Ej: Promo redes sociales"
                    className="w-full bg-black text-white border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-boston-gold transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="py-4 rounded-2xl bg-white/5 text-white/50 font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAdjustPoints}
                    disabled={isAdjusting || !pointsDelta || pointsDelta === "0" || pointsDelta === "-"}
                    className="py-4 rounded-2xl bg-boston-gold text-black font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {isAdjusting ? "Procesando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {historyUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryUser(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-10 pb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-1">Actividad del Socio</h3>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Socio: <span className="text-boston-gold">{historyUser.firstName} {historyUser.lastName}</span> • {historyUser.dni}</p>
                  </div>
                  <button onClick={() => setHistoryUser(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl">
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">Saldo Actual</p>
                    <p className="text-2xl font-black text-boston-gold italic tracking-tighter">{historyUser.points} PTS</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl">
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">Categoría</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{historyUser.membershipLevel}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-8 scrollbar-hide">
                {loadingHistory ? (
                   <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-2 border-boston-gold border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Consultando historial...</p>
                   </div>
                ) : (
                  <>
                    {/* Section: Canjes */}
                    <div>
                      <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Ticket className="w-3 h-3 text-boston-red-glow" /> Canjes de Beneficios
                      </h4>
                      <div className="space-y-3">
                        {historyData?.redemptions && historyData.redemptions.length > 0 ? (
                          historyData.redemptions.map(r => (
                            <div key={r.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/[0.05] transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/20'}`}>
                                  <CheckSquare className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-white text-xs font-black uppercase italic tracking-tight">{r.reward?.name || r.event?.title || 'Canje Desconocido'}</p>
                                  <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mt-1">Estado: <span className={r.status === 'COMPLETED' ? 'text-green-500/50' : 'text-white/40'}>{r.status}</span></p>
                                </div>
                              </div>
                              <p className="text-white/20 text-[9px] font-black uppercase">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[9px] text-white/10 uppercase font-black tracking-widest text-center py-4">No hay canjes registrados</p>
                        )}
                      </div>
                    </div>

                    {/* Section: Historial de Puntos */}
                    <div>
                      <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-boston-gold" /> Movimientos de Puntos
                      </h4>
                      <div className="space-y-3">
                        {historyData?.history && historyData.history.length > 0 ? (
                          historyData.history.map(h => (
                            <div key={h.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${h.pointsGained > 0 ? 'bg-green-500/10 text-green-500' : 'bg-boston-red/10 text-boston-red-glow'}`}>
                                  <Star className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-white text-xs font-black uppercase italic tracking-tight">{h.description}</p>
                                  <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mt-1">Origen: {h.source}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs font-black tracking-tighter ${h.pointsGained > 0 ? 'text-green-500' : 'text-boston-red-glow'}`}>
                                  {h.pointsGained > 0 ? '+' : ''}{h.pointsGained} PTS
                                </p>
                                <p className="text-white/20 text-[8px] uppercase mt-1">{new Date(h.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[9px] text-white/10 uppercase font-black tracking-widest text-center py-4">Sin movimientos de puntos</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Referrals Modal */}
      <AnimatePresence>
        {referralUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReferralUser(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-xl bg-[#0c0c0c] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-10 pb-6 border-b border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-1">Socios Referidos</h3>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Invitados por: <span className="text-boston-gold">{referralUser.firstName} {referralUser.lastName}</span></p>
                  </div>
                  <button onClick={() => setReferralUser(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-4 scrollbar-hide">
                {loadingReferrals ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-boston-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Cargando referidos...</p>
                  </div>
                ) : (
                  <>
                    {referralData.length > 0 ? (
                      referralData.map((ref) => (
                        <div key={ref.id} className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl flex justify-between items-center group hover:bg-white/[0.05] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-boston-gold/10 flex items-center justify-center text-boston-gold font-black text-xs">
                              {ref.firstName[0]}{ref.lastName[0]}
                            </div>
                            <div>
                              <p className="text-white text-sm font-black uppercase italic tracking-tight">{ref.firstName} {ref.lastName}</p>
                              <p className="text-white/30 text-[10px] font-bold mt-0.5">{ref.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Se unió el</p>
                            <p className="text-white/40 text-[10px] font-bold">{new Date(ref.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-white/20 uppercase font-black tracking-widest text-[10px] py-20">No hay referidos registrados para este usuario</p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
