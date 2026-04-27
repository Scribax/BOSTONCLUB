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
  const [birthDate, setBirthDate] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingToken, setPendingToken] = useState("");

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
        let formattedBirthDate = undefined;
        if (birthDate) {
          const parts = birthDate.split('/');
          if (parts.length === 3 && parts[2].length === 4) {
            formattedBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
             throw new Error("La fecha de nacimiento debe tener el formato DD/MM/AAAA");
          }
        }

        const data = await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ 
            firstName, 
            lastName, 
            dni, 
            whatsapp, 
            email, 
            password,
            birthDate: formattedBirthDate,
            referralCode: referralCode || undefined
          })
        });

        setPendingToken(data.token);
        setIsVerifying(true);
      }
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.type === "UNVERIFIED_EMAIL") {
          setPendingToken(parsed.token);
          
          // Request new code automatically
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api"}/auth/resend-verification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${parsed.token}`
            },
            body: JSON.stringify({ email })
          });
          
          setIsVerifying(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Not JSON
      }
      setErrorMsg(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setErrorMsg("El código debe tener 6 dígitos.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api"}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pendingToken}`
        },
        body: JSON.stringify({ code: verificationCode })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Código inválido");
      }

      setAuthToken(pendingToken);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden bg-boston-black">
      {/* Background Glows (Optimized for Mobile) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-boston-red/10 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-boston-gold/10 rounded-full blur-[60px] pointer-events-none" />

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
           <p className="text-[10px] font-black tracking-[0.3em] text-boston-gold uppercase opacity-80 text-center leading-tight">
             Fidelización Premium <br/><span className="text-white">Lanzamiento Oficial: 1 de Mayo</span>
           </p>
           <div className="h-[1px] w-4 bg-boston-gold/30" />
        </div>
      </motion.div>

      {/* Auth Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-boston-gold/20 via-boston-red/20 to-boston-gold/20 rounded-3xl blur-sm opacity-40 pointer-events-none" />
        <div className="relative bg-[#0a0a0a]/95 backdrop-blur-sm border border-white/10 p-8 rounded-3xl shadow-xl">
          
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center gap-2">
              <span className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center">{errorMsg}</span>
            </motion.div>
          )}

          {isVerifying ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Verificar Email</h2>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold leading-relaxed">
                  Ingresa el código de 6 dígitos enviado a<br/>
                  <span className="text-boston-gold">{email}</span>
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Código de Seguridad</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={verificationCode} 
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000" 
                  className="w-full bg-black/40 text-white border border-boston-gold/30 rounded-2xl py-4 px-4 outline-none focus:border-boston-gold transition-all text-2xl font-black tracking-[0.5em] text-center" 
                />
              </div>
              <button 
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="w-full relative group disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-boston-red via-boston-gold to-boston-red bg-[length:200%_auto] animate-shimmer rounded-2xl" />
                <div className="relative flex items-center justify-center gap-3 bg-boston-black py-4 px-8 rounded-2xl">
                  <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
                    {loading ? "Verificando..." : "Confirmar Código"}
                  </span>
                  {!loading && <ArrowRight className="w-4 h-4 text-boston-gold group-hover:translate-x-1 transition-transform" />}
                </div>
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {!isLogin && (
                  <div className="space-y-4">
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
                        onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))} 
                        placeholder="12345678" 
                        className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:border-boston-red transition-all text-sm font-bold tracking-[0.2em]" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">WhatsApp</label>
                      <input 
                        type="text" 
                        inputMode="tel"
                        value={whatsapp} 
                        onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))} 
                        placeholder="1112223334" 
                        className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:border-boston-red transition-all text-sm font-bold tracking-[0.2em]" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Nacimiento</label>
                        <input 
                          type="text" 
                          value={birthDate} 
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                            if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9);
                            setBirthDate(val);
                          }} 
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          className="w-full bg-black/40 text-white/80 border border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:border-boston-red transition-all text-sm font-medium tracking-widest" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-boston-gold uppercase ml-1 tracking-widest">Cód. Referido</label>
                        <input 
                          type="text" 
                          value={referralCode} 
                          onChange={e => {
                            let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            if (val.startsWith('BST')) val = val.substring(3);
                            setReferralCode(val ? 'BST-' + val : '');
                          }} 
                          placeholder="BST-XXXX" 
                          className="w-full bg-black/40 text-boston-gold border border-boston-gold/20 rounded-2xl py-3.5 px-4 outline-none focus:border-boston-gold transition-all text-sm font-bold tracking-[0.1em]" 
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Email Corporativo</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-boston-red transition-all text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Contraseña</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 pl-11 pr-12 outline-none focus:border-boston-red transition-all text-sm font-medium" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/60">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleAuth}
                  disabled={loading}
                  className="w-full relative group mt-4 overflow-hidden rounded-2xl p-[1px] transition-all hover:scale-[1.02] active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-boston-red via-boston-gold to-boston-red bg-[length:200%_auto] animate-shimmer" />
                  <div className="relative flex items-center justify-center gap-3 bg-boston-black py-4 px-8 rounded-2xl">
                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
                      {loading ? "Procesando..." : (isLogin ? "Iniciar Sesión" : "Registrarse")}
                    </span>
                    {!loading && <ArrowRight className="w-4 h-4 text-boston-gold group-hover:translate-x-1 transition-transform" />}
                  </div>
                </button>
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  <button 
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
                    className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-boston-gold transition-colors"
                  >
                    {isLogin ? "¿Aún no eres socio? Únete" : "¿Ya estás en la lista? Inicia sesión"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
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
