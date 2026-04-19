"use client";

import { motion } from "framer-motion";
import { ShieldAlert, LogOut, MessageSquare } from "lucide-react";
import { logout } from "@/lib/api";

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-boston-black flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel p-10 rounded-[3rem] border border-boston-red/30 max-w-sm w-full shadow-[0_0_50px_rgba(255,59,48,0.1)]"
      >
        <div className="w-20 h-20 bg-boston-red rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-10 h-10 text-white animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-black mb-4 uppercase italic tracking-tighter text-white">Cuenta Suspendida</h1>
        
        <p className="text-white/50 text-sm mb-10 leading-relaxed font-medium">
          Tu acceso al Boston Club ha sido restringido por la administración. Si crees que esto es un error, por favor contáctanos.
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => window.open('https://wa.me/your-number', '_blank')}
            className="w-full bg-white/5 border border-white/10 text-white font-bold uppercase text-[10px] tracking-[0.2em] py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Soporte WhatsApp
          </button>

          <button 
            onClick={() => logout()}
            className="w-full bg-boston-red text-white font-black uppercase text-[10px] tracking-[0.3em] py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </motion.div>
      
      <p className="mt-12 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
        Boston Club • Excelencia y Exclusividad
      </p>
    </div>
  );
}
