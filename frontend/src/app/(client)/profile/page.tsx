"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, User, Phone, Mail, Loader2, ShieldCheck, LogOut } from "lucide-react";
import Link from "next/link";
import { apiFetch, logout } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsapp: "",
    dni: "",
    membershipLevel: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiFetch("/auth/me");
      setUser(data);
    } catch (err) {
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          whatsapp: user.whatsapp
        })
      });
      alert("¡Perfil actualizado con éxito! ✨");
    } catch (err) {
      alert("Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-boston-black">
        <Loader2 className="w-10 h-10 text-boston-red-glow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-boston-black pb-12">
      {/* Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-64 h-64 bg-boston-red rounded-full filter blur-[100px] opacity-10 pointer-events-none" />

      <header className="px-6 pt-12 pb-6 flex items-center gap-4 relative z-10">
        <Link href="/dashboard" className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Mi Perfil</h1>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">Gestiona tus datos de socio</p>
        </div>
      </header>

      <main className="px-6 space-y-6 relative z-10">
        {/* Badge Card */}
        <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#111] to-black flex items-center gap-5">
           <div className="w-16 h-16 rounded-3xl bg-boston-red/10 border border-boston-red/20 flex items-center justify-center text-boston-red-glow">
              <User className="w-8 h-8" />
           </div>
           <div>
              <h2 className="text-white font-black text-lg">{user.firstName} {user.lastName}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <ShieldCheck className="w-3.5 h-3.5 text-boston-gold" />
                 <span className="text-[10px] font-black text-boston-gold uppercase tracking-[0.2em]">{user.membershipLevel}</span>
              </div>
           </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Datos de Contacto</p>
          
          <div className="glass-panel p-1 rounded-2xl border border-white/5 bg-black/40">
             <div className="flex items-center gap-4 p-4 border-b border-white/5">
                <User className="w-4 h-4 text-white/20" />
                <div className="flex-1">
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Nombre y Apellido</p>
                   <div className="flex gap-2">
                     <input 
                        className="bg-transparent text-white font-bold text-sm outline-none w-full"
                        value={user.firstName}
                        onChange={(e) => setUser({...user, firstName: e.target.value})}
                     />
                     <input 
                        className="bg-transparent text-white font-bold text-sm outline-none w-full text-right"
                        value={user.lastName}
                        onChange={(e) => setUser({...user, lastName: e.target.value})}
                     />
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-4 p-4 border-b border-white/5">
                <Phone className="w-4 h-4 text-emerald-500" />
                <div className="flex-1">
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">WhatsApp de Notificaciones</p>
                   <input 
                      className="bg-transparent text-emerald-500 font-black text-sm outline-none w-full"
                      value={user.whatsapp || ""}
                      onChange={(e) => setUser({...user, whatsapp: e.target.value.replace(/\D/g, '')})}
                      placeholder="1112223334"
                   />
                </div>
             </div>

             <div className="flex items-center gap-4 p-4 opacity-50">
                <Mail className="w-4 h-4 text-white/20" />
                <div className="flex-1">
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Email (Protegido)</p>
                   <p className="text-white/60 font-bold text-sm">{user.email}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={handleUpdate}
            disabled={saving}
            className="w-full bg-boston-red text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-boston-red/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>

          <button 
            onClick={logout}
            className="w-full bg-white/5 border border-white/5 text-white/40 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
}
