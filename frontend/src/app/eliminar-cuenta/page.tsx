"use client";

import { useState } from "react";
import { ShieldAlert, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { apiFetch, logout } from "@/lib/api";

export default function EliminarCuentaPage() {
  const [step, setStep] = useState<"info" | "confirm" | "done" | "error">("info");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/me", { method: "DELETE" });
      logout();
      setStep("done");
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error. Intentá nuevamente.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-widest">Eliminar Cuenta</h1>
          <p className="text-white/30 text-xs mt-2 uppercase tracking-widest font-bold">My Boston Club</p>
        </div>

        {step === "info" && (
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
              <p className="text-white/70 text-sm leading-relaxed">
                Al eliminar tu cuenta de <span className="text-white font-bold">My Boston Club</span>, se borrarán permanentemente:
              </p>
              <ul className="space-y-2">
                {["Tus datos personales (nombre, email, DNI, WhatsApp)", "Tu historial de puntos y transacciones", "Tus canjes y premios pendientes", "Tu nivel VIP y beneficios acumulados"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/50 text-sm">
                    <span className="text-red-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-white/30 text-xs leading-relaxed border-t border-white/5 pt-4">
                Esta acción es <span className="text-red-400 font-bold">irreversible</span>. Una vez eliminada, no podrás recuperar tu cuenta ni tus puntos.
              </p>
            </div>

            <button
              onClick={() => setStep("confirm")}
              className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase text-xs tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
            >
              <Trash2 className="w-4 h-4" />
              Quiero eliminar mi cuenta
            </button>

            <a
              href="/"
              className="block text-center text-white/20 text-xs uppercase tracking-widest font-bold hover:text-white/40 transition-colors"
            >
              Cancelar y volver
            </a>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-center">
              <p className="text-white font-bold text-sm leading-relaxed">
                ¿Estás seguro? Esta acción <span className="text-red-400">no se puede deshacer</span>.
              </p>
              <p className="text-white/40 text-xs mt-2">
                Todos tus datos y puntos serán eliminados permanentemente.
              </p>
            </div>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? "Eliminando..." : "Sí, eliminar mi cuenta definitivamente"}
            </button>

            <button
              onClick={() => setStep("info")}
              className="block w-full text-center text-white/20 text-xs uppercase tracking-widest font-bold hover:text-white/40 transition-colors py-2"
            >
              Cancelar
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-white font-bold text-lg">Cuenta eliminada</p>
            <p className="text-white/40 text-sm">Tus datos han sido borrados correctamente. Gracias por haber sido parte de Boston Club.</p>
          </div>
        )}

        {step === "error" && (
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-white font-bold">Ocurrió un error</p>
            <p className="text-white/40 text-sm">{errorMsg}</p>
            <button onClick={() => setStep("info")} className="text-white/30 text-xs uppercase tracking-widest hover:text-white/50 transition-colors">
              Intentar nuevamente
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
