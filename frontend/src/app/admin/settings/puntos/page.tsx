"use client";

import { useState, useEffect } from "react";
import { Coins, Save, RefreshCw, TrendingUp, AlertCircle, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

const EXAMPLE_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export default function PuntosSettingsPage() {
  const [rate, setRate] = useState<string>("1");
  const [savedRate, setSavedRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/settings");
      const currentRate = data.pointsPerPeso ?? 1;
      setRate(currentRate.toString());
      setSavedRate(currentRate);
    } catch (err) {
      setError("No se pudieron cargar los ajustes.");
    } finally {
      setIsLoading(false);
    }
  };

  const parsedRate = parseFloat(rate);
  const isValid = !isNaN(parsedRate) && parsedRate > 0;

  const calcPoints = (amount: number) => {
    if (!isValid) return "—";
    return Math.ceil(amount * parsedRate).toLocaleString("es-AR");
  };

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch("/settings", {
        method: "POST",
        body: JSON.stringify({ pointsPerPeso: parsedRate }),
      });
      setSavedRate(parsedRate);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-boston-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-black text-white tracking-widest uppercase italic">
          Configuración de Puntos
        </h1>
        <p className="text-white/50 text-sm mt-2 font-bold uppercase tracking-wider">
          Define cuántos puntos vale cada peso pagado en el POSNET
        </p>
      </header>

      {/* Rate Card */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-boston-gold rounded-full opacity-5 blur-[80px]" />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-boston-gold/10 rounded-2xl flex items-center justify-center border border-boston-gold/20">
            <Coins className="w-6 h-6 text-boston-gold" />
          </div>
          <div>
            <h2 className="text-white font-black tracking-widest uppercase text-lg italic">
              Tasa de Conversión
            </h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
              Tasa actual guardada: <span className="text-boston-gold">{savedRate} pts / peso</span>
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">
            Puntos por Peso Argentino ($)
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="number"
                min="0.0001"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={`w-full bg-black/50 text-white border rounded-2xl py-5 px-6 focus:outline-none text-2xl font-black transition-all ${
                  isValid ? "border-boston-gold/50 focus:border-boston-gold" : "border-red-500/50"
                }`}
                placeholder="Ej: 0.05"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 font-black text-sm uppercase">
                pts / $
              </span>
            </div>
          </div>

          {/* Hint */}
          <p className="text-white/30 text-xs mt-3 font-medium">
            💡 Ejemplos: <span className="text-white/50 font-bold">1.0</span> = 1 punto por peso ·
            <span className="text-white/50 font-bold"> 0.05</span> = 5 puntos por cada $100 ·
            <span className="text-white/50 font-bold"> 2.0</span> = 2 puntos por peso
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm font-bold">{error}</p>
          </div>
        )}

        {/* Guardar */}
        <button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="w-full py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] disabled:opacity-40 bg-boston-gold text-black shadow-boston-gold/20 flex items-center justify-center gap-3"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar Tasa"}
        </button>
      </div>

      {/* Live Calculator */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
            <TrendingUp className="w-6 h-6 text-white/60" />
          </div>
          <h2 className="text-white font-black tracking-widest uppercase text-lg italic">
            Calculadora en Vivo
          </h2>
        </div>

        <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-6">
          Así quedarían los puntos con la tasa actual ({isValid ? parsedRate : "—"} pts/peso)
        </p>

        <div className="space-y-3">
          {EXAMPLE_AMOUNTS.map((amount) => (
            <div
              key={amount}
              className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-xs font-bold uppercase tracking-wider">Pago de</span>
                <span className="text-white font-black text-lg">
                  ${amount.toLocaleString("es-AR")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-xs font-bold">→</span>
                <span className="text-boston-gold font-black text-xl">
                  {calcPoints(amount)}
                </span>
                <span className="text-white/30 text-xs font-bold uppercase tracking-wider">pts</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-4 text-center">
          * Los puntos siempre se redondean para arriba (Math.ceil). <br/>
          <span className="text-boston-gold/40">Nota: El sistema de "Racha" de la app puede multiplicar estos puntos (x1.5 o x2.0) según la fidelidad del socio.</span>
        </p>
      </div>
    </div>
  );
}
