"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, KeyRound, Mail, ArrowRight, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { apiFetch, setAuthToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (isLogin) {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        setAuthToken(data.token);
        window.location.href = data.user?.role === "ADMIN" ? "/admin" : "/dashboard";
      } else {
        const data = await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ 
            firstName, 
            lastName, 
            dni, 
            whatsapp, 
            email, 
            password 
          })
        });

        setAuthToken(data.token);
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden bg-boston-black">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-boston-red rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-boston-gold rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse-slow" />

      {/* Logo & Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 flex flex-col items-center z-10"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-[#111] to-black rounded-2xl flex items-center justify-center shadow-2xl border border-white/5 mb-4 group hover:border-boston-gold/30 transition-all duration-500">
          <Crown className="w-10 h-10 text-boston-gold drop-shadow-[0_0_15px_rgba(204,166,80,0.5)] group-hover:scale-110 transition-transform" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase text-center italic">
          Boston <span className="text-boston-red-glow">Club</span>
        </h1>
        <div className="flex items-center gap-2 mt-2">
           <div className="h-[1px] w-4 bg-boston-gold/30" />
           <p className="text-[10px] font-black tracking-[0.3em] text-boston-gold uppercase opacity-80">
             Fidelización Premium
           </p>
           <div className="h-[1px] w-4 bg-boston-gold/30" />
        </div>
      </motion.div>

      {/* Auth Card */}
      <motion.div 
        layout
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md glass-panel border border-white/10 rounded-[2.5rem] p-8 relative z-10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]"
      >
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-200 text-[11px] font-bold p-3 rounded-xl text-center mb-6 uppercase tracking-wider overflow-hidden"
            >
              ⚠️ {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-5">
          {!isLogin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Nombre</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:border-boston-red transition-all text-sm font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Apellido</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Pérez" className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:border-boston-red transition-all text-sm font-medium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">DNI (8 números)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={dni} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setDni(val);
                  }} 
                  placeholder="12345678" 
                  className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:border-boston-red transition-all text-sm font-bold tracking-[0.2em] placeholder:tracking-normal placeholder:font-normal" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">WhatsApp (Solo números)</label>
                <input 
                  type="text" 
                  inputMode="tel"
                  value={whatsapp} 
                  onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))} 
                  placeholder="1112223334" 
                  className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:border-boston-red transition-all text-sm font-bold tracking-[0.2em] placeholder:tracking-normal placeholder:font-normal" 
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Email Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-boston-red transition-colors" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-boston-red transition-all text-sm font-medium placeholder:text-white/10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Contraseña</label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-boston-red transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 pl-11 pr-12 outline-none focus:border-boston-red transition-all text-sm font-medium placeholder:text-white/10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button 
            onClick={handleAuth}
            disabled={loading}
            className={`w-full relative group mt-4 overflow-hidden rounded-2xl p-[1px] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${loading ? 'cursor-wait' : 'cursor-pointer'}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-boston-red via-boston-gold to-boston-red bg-[length:200%_auto] animate-shimmer`} />
            <div className="relative flex items-center justify-center gap-3 bg-boston-black py-4 px-8 rounded-2xl">
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
                {loading ? "Verificando..." : (isLogin ? "Iniciar Sesión" : "Crear Perfil")}
              </span>
              {!loading && <ArrowRight className="w-4 h-4 text-boston-gold group-hover:translate-x-1 transition-transform" />}
            </div>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
            className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-boston-gold transition-colors"
          >
            {isLogin ? "¿No tienes cuenta? Regístrate gratis" : "¿Ya eres socio? Identifícate"}
          </button>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        className="mt-12 text-[9px] font-bold text-white uppercase tracking-[0.4em]"
      >
        © 2026 Boston Club Social
      </motion.p>
    </div>
  );
}
