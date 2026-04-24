"use client";

import { ShieldCheck, Users, QrCode, LayoutDashboard, CalendarPlus, Gift, Zap, Monitor, Settings, Smartphone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDisplayMode = pathname === "/admin/display";

  if (isDisplayMode) {
    return <div className="min-h-screen bg-boston-black">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-boston-black flex flex-col md:flex-row">

      {/* Mobile Top Bar */}
      <div className="md:hidden glass-panel sticky top-0 z-50 p-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-boston-red-glow" />
          <span className="text-white font-bold tracking-widest text-sm">ADMIN</span>
        </div>
        <Link href="/admin/scan" className="bg-white/10 p-2 rounded-lg">
          <QrCode className="w-5 h-5 text-white" />
        </Link>
      </div>

      {/* Desktop Sidebar / Mobile Bottom Nav */}
      <nav className="fixed md:sticky bottom-0 md:top-0 w-full md:w-72 bg-[#0c0c0c] md:h-screen border-t md:border-t-0 md:border-r border-white/10 z-50 flex md:flex-col justify-around md:justify-start p-2 md:p-8 pb-6 md:pb-8 shadow-xl shadow-black">
        <div className="hidden md:flex items-center gap-3 mb-10">
          <ShieldCheck className="w-8 h-8 text-boston-red-glow" />
           <span className="text-white font-black tracking-widest text-xl">ADMIN PANEL</span>
        </div>

        <Link href="/admin" className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white">
           <LayoutDashboard className="w-5 h-5" />
           <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Dashboard</span>
        </Link>
        
        <Link href="/admin/users" className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white">
           <Users className="w-5 h-5" />
           <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Usuarios</span>
        </Link>
        
        <Link href="/admin/content" className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white">
           <Smartphone className="w-5 h-5 text-boston-gold" />
           <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Gestión de Inicio</span>
        </Link>

        <Link href="/admin/rewards" className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white">
           <Gift className="w-5 h-5" />
           <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Gestión Premios</span>
        </Link>

        <Link href="/admin/promo" className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white">
           <Zap className="w-5 h-5 text-boston-red-glow" />
           <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Regalos QR</span>
        </Link>



        <Link href="/admin/display" className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white">
           <Monitor className="w-5 h-5 text-boston-gold" />
           <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Modo Pantalla</span>
        </Link>

        <Link href="/admin/settings/vip" className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white">
           <Settings className="w-5 h-5 text-white/40" />
           <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Ajustes VIP</span>
        </Link>

        <Link href="/admin/scan" className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-3 md:px-4 md:py-3 rounded-xl bg-boston-red/20 text-boston-red-glow md:text-white/70 md:bg-transparent md:hover:bg-white/5 md:hover:text-white transition-colors relative md:mt-auto">
           <div className="absolute inset-0 bg-boston-red-glow blur-xl opacity-20 md:hidden" />
           <QrCode className="w-5 h-5 relative z-10" />
           <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider relative z-10">Escáner QR</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-[#050505] p-6 md:p-12 pb-24 md:pb-12 relative overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
