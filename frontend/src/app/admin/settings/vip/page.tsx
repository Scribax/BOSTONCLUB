"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Save, Crown, MessageSquare, ListCheck, Loader2, Users, 
  Plus, Trash2, Edit3, Shield, RefreshCcw, Zap, X, Check
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatWithDots, parseSmartNumber } from "@/lib/numberFormatting";

type VipBenefit = {
  id: string;
  level: string;
  title: string;
  description: string;
  redemptionPolicy: string;
  isActive: boolean;
};

const LEVELS = ["BRONCE", "ORO", "PLATINO", "DIAMANTE", "SÚPER VIP"];
const LEVEL_COLORS: Record<string, string> = {
  BRONCE: "text-amber-600",
  ORO: "text-boston-gold",
  PLATINO: "text-white",
  DIAMANTE: "text-cyan-400",
  "SÚPER VIP": "text-boston-red-glow",
};
const LEVEL_BG: Record<string, string> = {
  BRONCE: "bg-amber-600/10 border-amber-600/20",
  ORO: "bg-boston-gold/10 border-boston-gold/20",
  PLATINO: "bg-white/10 border-white/20",
  DIAMANTE: "bg-cyan-400/10 border-cyan-400/20",
  "SÚPER VIP": "bg-boston-red/10 border-boston-red/20",
};

export default function VipSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [benefits, setBenefits] = useState<VipBenefit[]>([]);
  const [benefitsLoading, setBenefitsLoading] = useState(true);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<VipBenefit | null>(null);
  const [savingBenefit, setSavingBenefit] = useState(false);

  // Benefit form state
  const [bLevel, setBLevel] = useState("ORO");
  const [bTitle, setBTitle] = useState("");
  const [bDescription, setBDescription] = useState("");
  const [bPolicy, setBPolicy] = useState("ONCE_PER_NIGHT");
  const [bActive, setBActive] = useState(true);

  const [settings, setSettings] = useState({
    vipThreshold: 1000,
    goldThreshold: 500000,
    platinumThreshold: 1500000,
    diamondThreshold: 5000000,
    superVipThreshold: 10000000,
    vipMessageTemplate: "",
    rewardListText: "",
    bronceBenefits: "",
    goldBenefits: "",
    platinumBenefits: "",
    diamondBenefits: "",
    superVipBenefits: "",
    loginVideoUrl: "",
    referralRewardReferrer: 500,
    referralRewardReferee: 200
  });

  useEffect(() => {
    fetchSettings();
    fetchBenefits();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/settings");
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBenefits = async () => {
    setBenefitsLoading(true);
    try {
      const data = await apiFetch("/vip-benefits");
      setBenefits(data);
    } catch (err) {
      console.error("Error fetching benefits", err);
    } finally {
      setBenefitsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/settings", {
        method: "POST",
        body: JSON.stringify(settings)
      });
      alert("¡Ajustes de Niveles guardados con éxito! 🎉");
    } catch (err) {
      alert("Error al guardar los ajustes");
    } finally {
      setSaving(false);
    }
  };

  const openCreateBenefit = () => {
    setEditingBenefit(null);
    setBLevel("ORO");
    setBTitle("");
    setBDescription("");
    setBPolicy("ONCE_PER_NIGHT");
    setBActive(true);
    setShowBenefitModal(true);
  };

  const openEditBenefit = (benefit: VipBenefit) => {
    setEditingBenefit(benefit);
    setBLevel(benefit.level);
    setBTitle(benefit.title);
    setBDescription(benefit.description);
    setBPolicy(benefit.redemptionPolicy);
    setBActive(benefit.isActive);
    setShowBenefitModal(true);
  };

  const handleSaveBenefit = async () => {
    if (!bTitle.trim()) return alert("El título es obligatorio");
    setSavingBenefit(true);
    try {
      if (editingBenefit) {
        await apiFetch(`/vip-benefits/${editingBenefit.id}`, {
          method: "PATCH",
          body: JSON.stringify({ level: bLevel, title: bTitle, description: bDescription, redemptionPolicy: bPolicy, isActive: bActive })
        });
      } else {
        await apiFetch("/vip-benefits", {
          method: "POST",
          body: JSON.stringify({ level: bLevel, title: bTitle, description: bDescription, redemptionPolicy: bPolicy, isActive: bActive })
        });
      }
      setShowBenefitModal(false);
      fetchBenefits();
    } catch (err) {
      alert("Error al guardar el beneficio");
    } finally {
      setSavingBenefit(false);
    }
  };

  const handleDeleteBenefit = async (id: string) => {
    if (!confirm("¿Eliminar este beneficio?")) return;
    try {
      await apiFetch(`/vip-benefits/${id}`, { method: "DELETE" });
      fetchBenefits();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const policyLabel: Record<string, string> = {
    ONCE_TOTAL: "Una sola vez",
    ONCE_PER_NIGHT: "Una vez por noche (12hs)",
    UNLIMITED: "Ilimitado",
  };
  const policyIcon: Record<string, React.ReactElement> = {
    ONCE_TOTAL: <Shield className="w-3 h-3" />,
    ONCE_PER_NIGHT: <RefreshCcw className="w-3 h-3" />,
    UNLIMITED: <Zap className="w-3 h-3" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-boston-black">
        <Loader2 className="w-10 h-10 text-boston-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6">
      <header className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/users" className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Rangos y Beneficios</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Niveles, umbrales y beneficios canjeables</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="relative group overflow-hidden rounded-2xl p-[1px] transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-boston-red via-boston-gold to-boston-red bg-[length:200%_auto] animate-shimmer" />
          <div className="relative flex items-center justify-center gap-3 bg-boston-black py-3 px-8 rounded-2xl border border-white/10">
            {saving ? <Loader2 className="w-4 h-4 text-boston-gold animate-spin" /> : <Save className="w-4 h-4 text-boston-gold" />}
            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
              {saving ? "Guardando..." : "Guardar Umbrales"}
            </span>
          </div>
        </button>
      </header>

      <div className="space-y-8">
        {/* Tier Thresholds */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-[#0c0c0c] to-black">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-boston-gold/10 rounded-2xl flex items-center justify-center border border-boston-gold/20">
              <Crown className="w-6 h-6 text-boston-gold" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Umbrales de Niveles</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Puntos necesarios para subir de rango</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "ORO", key: "goldThreshold", color: "text-boston-gold", icon: "🥇" },
              { label: "PLATINO", key: "platinumThreshold", color: "text-white", icon: "💎" },
              { label: "DIAMANTE", key: "diamondThreshold", color: "text-cyan-400", icon: "💠" },
              { label: "SÚPER VIP", key: "superVipThreshold", color: "text-boston-red-glow", icon: "🔥" },
            ].map((tier) => (
              <div key={tier.key} className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ${tier.color}`}>
                  {tier.icon} Nivel {tier.label}
                </label>
                <input 
                  type="text" 
                  value={formatWithDots(settings[tier.key as keyof typeof settings])}
                  onChange={(e) => {
                    const val = parseSmartNumber(e.target.value);
                    setSettings({ ...settings, [tier.key]: val });
                  }}
                  className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-4 px-6 text-2xl font-black focus:border-boston-gold transition-all outline-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Puntos para el que invita (Referrer)</label>
              <input 
                type="text" 
                value={formatWithDots(settings.referralRewardReferrer)}
                onChange={(e) => setSettings({ ...settings, referralRewardReferrer: parseSmartNumber(e.target.value) })}
                className="w-full bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 text-xl font-black outline-none focus:border-boston-gold/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Puntos para el invitado (Referee)</label>
              <input 
                type="text" 
                value={formatWithDots(settings.referralRewardReferee)}
                onChange={(e) => setSettings({ ...settings, referralRewardReferee: parseSmartNumber(e.target.value) })}
                className="w-full bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 text-xl font-black outline-none focus:border-boston-gold/30"
              />
            </div>
          </div>
        </div>

        {/* VIP Benefits Manager */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-[#0c0c0c] to-black">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-boston-gold/10 rounded-2xl flex items-center justify-center border border-boston-gold/20">
                <ListCheck className="w-6 h-6 text-boston-gold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Beneficios VIP por Nivel</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Canjeables por QR desde la app</p>
              </div>
            </div>
            <button
              onClick={openCreateBenefit}
              className="flex items-center gap-2 bg-boston-gold text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-boston-gold/20"
            >
              <Plus className="w-4 h-4" /> Nuevo Beneficio
            </button>
          </div>

          {benefitsLoading ? (
            <div className="flex items-center justify-center py-20 opacity-20">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : benefits.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
              <Crown className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <p className="text-white/20 uppercase font-black text-[10px] tracking-widest">No hay beneficios creados aún</p>
              <p className="text-white/10 text-[9px] mt-2">Crea el primer beneficio usando el botón de arriba</p>
            </div>
          ) : (
            <div className="space-y-4">
              {LEVELS.map(level => {
                const levelBenefits = benefits.filter(b => b.level === level);
                if (levelBenefits.length === 0) return null;
                return (
                  <div key={level}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${LEVEL_COLORS[level]}`}>
                      ★ {level}
                    </p>
                    <div className="space-y-3">
                      {levelBenefits.map(benefit => (
                        <div key={benefit.id} className={`flex items-center gap-4 p-5 rounded-[1.5rem] border ${LEVEL_BG[benefit.level]} ${!benefit.isActive ? 'opacity-40' : ''}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-black text-sm">{benefit.title}</h4>
                              {!benefit.isActive && <span className="text-[8px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full uppercase font-black">Inactivo</span>}
                            </div>
                            {benefit.description && <p className="text-white/40 text-[11px]">{benefit.description}</p>}
                            <div className="flex items-center gap-1.5 mt-2">
                              {policyIcon[benefit.redemptionPolicy]}
                              <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">{policyLabel[benefit.redemptionPolicy]}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditBenefit(benefit)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-all">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteBenefit(benefit.id)} className="w-9 h-9 bg-boston-red/5 rounded-xl flex items-center justify-center text-boston-red/40 hover:text-boston-red transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* WhatsApp Template */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-[#0c0c0c] to-black">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-boston-red/10 rounded-2xl flex items-center justify-center border border-boston-red/20">
              <MessageSquare className="w-6 h-6 text-boston-red-glow" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Mensaje de WhatsApp</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Plantilla automática para el premio</p>
            </div>
          </div>
          <textarea 
            rows={5}
            value={settings.vipMessageTemplate}
            onChange={(e) => setSettings({ ...settings, vipMessageTemplate: e.target.value })}
            placeholder="¡Felicidades {name}!..."
            className="w-full bg-black/40 text-white border border-white/10 rounded-3xl py-6 px-8 text-sm font-medium focus:border-boston-red outline-none transition-all placeholder:text-white/10 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Benefit Modal */}
      <AnimatePresence>
        {showBenefitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowBenefitModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-panel w-full max-w-lg p-10 rounded-[3rem] border border-white/10 relative z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingBenefit ? "Editar Beneficio" : "Nuevo Beneficio VIP"}</h2>
                  <p className="text-boston-gold text-[10px] font-black uppercase tracking-widest mt-1">Canjeable desde la app</p>
                </div>
                <button onClick={() => setShowBenefitModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Level */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-3 block">Nivel Requerido</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LEVELS.map(l => (
                      <button
                        key={l}
                        onClick={() => setBLevel(l)}
                        className={`py-3 px-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all text-left ${bLevel === l ? `${LEVEL_BG[l]} ${LEVEL_COLORS[l]}` : 'bg-white/5 text-white/30 border-white/5'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-3 block">Título del Beneficio</label>
                  <input
                    type="text"
                    value={bTitle}
                    onChange={(e) => setBTitle(e.target.value)}
                    placeholder="Ej: 10% Off en toda la carta"
                    className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm font-bold"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-3 block">Descripción (opcional)</label>
                  <input
                    type="text"
                    value={bDescription}
                    onChange={(e) => setBDescription(e.target.value)}
                    placeholder="Ej: Válido en food y cocktails"
                    className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm"
                  />
                </div>

                {/* Policy */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-3 block">Política de Uso</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "ONCE_TOTAL", label: "Una sola vez (Permanente)", icon: Shield },
                      { id: "ONCE_PER_NIGHT", label: "Una vez por noche (12hs)", icon: RefreshCcw },
                      { id: "UNLIMITED", label: "Ilimitado (Siempre disponible)", icon: Zap },
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setBPolicy(p.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${bPolicy === p.id ? 'bg-white text-black border-white' : 'bg-black/20 text-white/40 border-white/5 hover:border-white/20'}`}
                      >
                        <p.icon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                        {bPolicy === p.id && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Activo en la App</span>
                  <button onClick={() => setBActive(!bActive)} className={`w-14 h-7 rounded-full relative transition-all ${bActive ? 'bg-boston-gold' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${bActive ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <button
                  onClick={handleSaveBenefit}
                  disabled={savingBenefit}
                  className="w-full bg-boston-gold text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-boston-gold/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {savingBenefit ? "Guardando..." : (editingBenefit ? "Guardar Cambios" : "Crear Beneficio")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
