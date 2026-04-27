"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Crown, MessageSquare, ListCheck, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatWithDots, parseSmartNumber } from "@/lib/numberFormatting";

export default function VipSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("El video es demasiado pesado (máx 100MB)");
      return;
    }

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api"}/settings/upload-video`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("boston_club_token")}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setSettings({ ...settings, loginVideoUrl: data.url });
        alert("¡Video subido con éxito! 🎥");
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert("Error al subir el video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const getFullUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";
    // Eliminar /api del final de la URL base para acceder a /uploads
    const rootUrl = baseUrl.replace(/\/api$/, "");
    return `${rootUrl}${url}`;
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
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Rangos y Niveles</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Define las metas de puntos para cada nivel de membresía</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="relative group overflow-hidden rounded-2xl p-[1px] transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-boston-red via-boston-gold to-boston-red bg-[length:200%_auto] animate-shimmer" />
          <div className="relative flex items-center justify-center gap-3 bg-boston-black py-3 px-8 rounded-2xl border border-white/10">
            {saving ? <Loader2 className="w-4 h-4 text-boston-gold animate-spin" /> : <Save className="w-4 h-4 text-boston-gold" /> }
            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
              {saving ? "Guardando..." : "Guardar Cambios"}
            </span>
          </div>
        </button>
      </header>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tiers Thresholds */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-[#0c0c0c] to-black"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-boston-gold/10 rounded-2xl flex items-center justify-center border border-boston-gold/20 shadow-[0_0_20px_rgba(204,166,80,0.1)]">
                <Crown className="w-6 h-6 text-boston-gold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Umbrales de Niveles</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">Puntos necesarios para subir de rango</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "ORO", key: "goldThreshold", color: "text-boston-gold", icon: "🥇" },
                { label: "PLATINO", key: "platinumThreshold", color: "text-white", icon: "💎" },
                { label: "DIAMANTE", key: "diamondThreshold", color: "text-cyan-400", icon: "💠" },
                { label: "SÚPER VIP", key: "superVipThreshold", color: "text-boston-red-glow", icon: "🔥" },
              ].map((tier) => (
                <div key={tier.key} className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${tier.color}`}>
                      {tier.icon} Nivel {tier.label}
                    </label>
                  </div>
                  <div className="relative">
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
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 space-y-8">
                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 block">Filtro Visual VIP (Anterior)</label>
                  <div className="flex items-center gap-6">
                      <input 
                        type="text" 
                        value={formatWithDots(settings.vipThreshold)}
                        onChange={(e) => setSettings({ ...settings, vipThreshold: parseSmartNumber(e.target.value) })}
                        className="w-40 bg-white/5 text-white border border-white/10 rounded-xl py-2 px-4 text-lg font-bold outline-none"
                      />
                      <p className="text-[9px] text-white/20 font-medium uppercase leading-tight italic">
                        Umbral original para resaltar usuarios. Usa "k" o "m".
                      </p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-4 h-4 text-boston-gold" />
                    <h4 className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Puntos por Referidos</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Para el que invita (Referrer)</label>
                      <input 
                        type="text" 
                        value={formatWithDots(settings.referralRewardReferrer)}
                        onChange={(e) => setSettings({ ...settings, referralRewardReferrer: parseSmartNumber(e.target.value) })}
                        className="w-full bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 text-xl font-black outline-none focus:border-boston-gold/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Para el invitado (Referee)</label>
                      <input 
                        type="text" 
                        value={formatWithDots(settings.referralRewardReferee)}
                        onChange={(e) => setSettings({ ...settings, referralRewardReferee: parseSmartNumber(e.target.value) })}
                        className="w-full bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 text-xl font-black outline-none focus:border-boston-gold/30"
                      />
                    </div>
                  </div>
                </div>
            </div>
          </motion.div>


        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Template */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-[#0c0c0c] to-black"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-boston-red/10 rounded-2xl flex items-center justify-center border border-boston-red/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <MessageSquare className="w-6 h-6 text-boston-red-glow" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Mensaje de WhatsApp</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">Plantilla automática para el premio</p>
              </div>
            </div>

            <div className="space-y-6">
              <textarea 
                rows={5}
                value={settings.vipMessageTemplate}
                onChange={(e) => setSettings({ ...settings, vipMessageTemplate: e.target.value })}
                placeholder="¡Felicidades {name}!..."
                className="w-full bg-black/40 text-white border border-white/10 rounded-3xl py-6 px-8 text-sm font-medium focus:border-boston-red outline-none transition-all placeholder:text-white/10 resize-none leading-relaxed"
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] font-black bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-white/40 uppercase tracking-widest">Atajos:</span>
                <button 
                  onClick={() => setSettings({ ...settings, vipMessageTemplate: settings.vipMessageTemplate + " {name}" })}
                  className="text-[9px] font-black bg-boston-gold/10 border border-boston-gold/20 px-3 py-1.5 rounded-full text-boston-gold hover:bg-boston-gold hover:text-black transition-all"
                >
                  &#123;name&#125;
                </button>
                <button 
                onClick={() => setSettings({ ...settings, vipMessageTemplate: settings.vipMessageTemplate + " {points}" })}
                  className="text-[9px] font-black bg-boston-gold/10 border border-boston-gold/20 px-3 py-1.5 rounded-full text-boston-gold hover:bg-boston-gold hover:text-black transition-all"
                >
                  &#123;points&#125;
                </button>
              </div>
            </div>
          </motion.div>

          {/* Reward List (Moved here) */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-[#0c0c0c] to-black"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <ListCheck className="w-6 h-6 text-white/40" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Lista de Premios</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">Visibles en la App</p>
              </div>
            </div>

            <textarea 
              rows={6}
              value={settings.rewardListText}
              onChange={(e) => setSettings({ ...settings, rewardListText: e.target.value })}
              className="w-full bg-black/40 text-white border border-white/10 rounded-3xl py-6 px-8 text-sm font-medium focus:border-white transition-all outline-none placeholder:text-white/10 resize-none leading-relaxed"
            />
          </motion.div>
        </div>

        {/* Per-Tier Benefits (Full Width Grid) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-gradient-to-br from-[#0c0c0c] to-black"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-boston-gold/10 rounded-2xl flex items-center justify-center border border-boston-gold/20 shadow-[0_0_20px_rgba(204,166,80,0.1)]">
              <ListCheck className="w-6 h-6 text-boston-gold" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Privilegios por Rango</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">Beneficios exclusivos para cada nivel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { label: "BRONCE", key: "bronceBenefits", color: "text-white/40", icon: "🥉" },
              { label: "ORO", key: "goldBenefits", color: "text-boston-gold", icon: "🥇" },
              { label: "PLATINO", key: "platinumBenefits", color: "text-white", icon: "💎" },
              { label: "DIAMANTE", key: "diamondBenefits", color: "text-cyan-400", icon: "💠" },
              { label: "SÚPER VIP", key: "superVipBenefits", color: "text-boston-red-glow", icon: "🔥" },
            ].map((tier) => (
              <div key={tier.key} className="space-y-4 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tier.icon}</span>
                  <label className={`text-[11px] font-black uppercase tracking-[0.2em] ${tier.color}`}>
                    {tier.label}
                  </label>
                </div>
                <textarea 
                  rows={4}
                  value={(settings as any)[tier.key]}
                  onChange={(e) => setSettings({ ...settings, [tier.key]: e.target.value })}
                  placeholder={`- Beneficio 1\n- Beneficio 2...`}
                  className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-4 px-5 text-xs font-medium focus:border-white/20 outline-none transition-all placeholder:text-white/5 resize-none leading-relaxed"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
