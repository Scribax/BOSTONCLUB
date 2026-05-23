"use client";

import { useState, useEffect } from "react";
import { CreditCard, Save, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function MercadoPagoSettingsPage() {
  const [status, setStatus] = useState<{ configured: boolean; source: string; maskedToken: string | null } | null>(null);
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await apiFetch("/settings/mp-credentials");
      setStatus(data);
    } catch {
      setStatus(null);
    }
  };

  const handleSave = async () => {
    if (!mpAccessToken.trim()) return;
    setSaving(true);
    setResult(null);
    try {
      const data = await apiFetch("/settings/mp-credentials", {
        method: "POST",
        body: JSON.stringify({ mpAccessToken: mpAccessToken.trim(), mpPublicKey: mpPublicKey.trim() }),
      });
      setResult({ ok: true, message: data.message + " Token activo: " + data.maskedToken });
      setMpAccessToken("");
      setMpPublicKey("");
      fetchStatus();
    } catch (err: any) {
      setResult({ ok: false, message: err?.message || "Error al guardar las credenciales." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-3xl font-black text-white tracking-widest uppercase italic">MercadoPago</h1>
        <p className="text-white/50 text-sm mt-2 font-bold uppercase tracking-wider">Credenciales de integración de pagos</p>
      </header>

      {/* Estado actual */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-boston-gold/10 rounded-2xl flex items-center justify-center border border-boston-gold/20">
            <CreditCard className="w-6 h-6 text-boston-gold" />
          </div>
          <div>
            <h2 className="text-white font-black tracking-widest uppercase text-base italic">Estado Actual</h2>
            <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Credencial en uso por el sistema</p>
          </div>
          <button onClick={fetchStatus} className="ml-auto p-2 hover:bg-white/5 rounded-xl transition-all">
            <RefreshCw className="w-4 h-4 text-white/30" />
          </button>
        </div>

        {status ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {status.configured ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              )}
              <div>
                <p className="text-white font-bold text-sm">
                  {status.configured ? "Configurado desde base de datos" : "Usando token del servidor (.env)"}
                </p>
                <p className="text-white/30 text-xs mt-0.5">
                  {status.configured
                    ? "Este token sobreescribe el del servidor. Podés cambiarlo cuando quieras."
                    : "No hay token guardado en la base de datos. Se usa el del servidor por defecto."}
                </p>
              </div>
            </div>
            {status.maskedToken && (
              <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-4">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Token activo</p>
                <p className="text-boston-gold font-mono text-sm tracking-wider">{status.maskedToken}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/30 text-sm">Cargando estado...</p>
        )}
      </div>

      {/* Formulario */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <h2 className="text-white font-black tracking-widest uppercase text-base italic mb-6">Actualizar Credenciales</h2>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">
              Access Token <span className="text-boston-red-glow">*</span>
            </label>
            <p className="text-white/30 text-xs mb-3">
              Lo encontrás en tu cuenta de MercadoPago → Tu negocio → Credenciales → Access Token de producción.
            </p>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder="APP-xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-5 pr-12 focus:border-boston-gold transition-all outline-none text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">
              Public Key <span className="text-white/20">(opcional)</span>
            </label>
            <p className="text-white/30 text-xs mb-3">
              Solo necesaria si usás el checkout web. Mismo lugar que el Access Token.
            </p>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-5 pr-12 focus:border-boston-gold transition-all outline-none text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {result && (
            <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 border ${result.ok ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-boston-red/10 border-boston-red/20 text-red-400"}`}>
              {result.ok ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <p className="text-sm font-bold">{result.message}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !mpAccessToken.trim()}
              className="w-full py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] bg-boston-gold text-black shadow-xl shadow-boston-gold/20 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Guardando..." : "Guardar y Activar"}
            </button>
          </div>

          <p className="text-center text-white/20 text-[9px] uppercase tracking-widest">
            El cambio es inmediato — no requiere reiniciar el servidor
          </p>
        </div>
      </div>
    </div>
  );
}
