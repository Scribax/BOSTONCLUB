"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MapPin, ArrowLeft, RotateCcw, Copy, Check, Info, Coins, Clock, ArrowRight, QrCode } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatWithDots, parseSmartNumber } from "@/lib/numberFormatting";

export default function AdminPromoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeToken, setActiveToken] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Custom states for the generator
  const [lightningPoints, setLightningPoints] = useState(400);
  const [lightningExpiry, setLightningExpiry] = useState(3);
  const [dailyPoints, setDailyPoints] = useState(100);
  const [isEventDay, setIsEventDay] = useState(false);
  const [eventPoints, setEventPoints] = useState(1000);
  const [settings, setSettings] = useState<any>(null);
  
  // Scanner states
  const [scannedToken, setScannedToken] = useState("");
  const [scannerPoints, setScannerPoints] = useState(100);
  const [scannerStatus, setScannerStatus] = useState<{ type: 'idle' | 'success' | 'error', message?: string }>({ type: 'idle' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/settings");
      setSettings(data);
      if (data.checkinPoints) setDailyPoints(data.checkinPoints);
      if (data.eventCheckinPoints) setEventPoints(data.eventCheckinPoints);
      setIsEventDay(!!data.isEventDay);
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  // Calculator states
  const [spentAmount, setSpentAmount] = useState<number | "">("");
  const [rewardPercentage, setRewardPercentage] = useState(10);
  const calculatedPoints = spentAmount ? Math.floor(Number(spentAmount) * (rewardPercentage / 100)) : 0;

  const generateToken = async (type: "SINGLE_USE" | "DAILY_CHECKIN", points: number, expiresMinutes: number | null) => {
    setLoading(true);
    try {
      if (type === "DAILY_CHECKIN") {
        await apiFetch("/settings", {
          method: "POST",
          body: JSON.stringify({ 
            ...settings,
            checkinPoints: dailyPoints,
            isEventDay,
            eventCheckinPoints: eventPoints
          })
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }

      const data = await apiFetch("/promo/generate", {
        method: "POST",
        body: JSON.stringify({ 
          points: isEventDay && type === "DAILY_CHECKIN" ? eventPoints : points, 
          type, 
          expiresMinutes 
        })
      });
      
      if (type === "SINGLE_USE") {
        setActiveToken(data);
      }
    } catch (err) {
      alert("Error al generar token o guardar ajustes");
    } finally {
      setLoading(false);
    }
  };

  const applyCalculated = () => {
    if (calculatedPoints > 0) {
      setLightningPoints(calculatedPoints);
    }
  };

  const copyToClipboard = () => {
    if (!activeToken) return;
    navigator.clipboard.writeText(activeToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePhysicalScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedToken || !scannerPoints) {
      if (!scannerPoints) alert("Ingresa los puntos primero");
      setScannedToken("");
      return;
    }

    setLoading(true);
    setScannerStatus({ type: 'idle' });
    try {
      const res = await apiFetch("/member-qr/credit", {
        method: "POST",
        body: JSON.stringify({
          token: scannedToken,
          points: scannerPoints
        })
      });
      
      setScannerStatus({ 
        type: 'success', 
        message: `¡Acreditados ${scannerPoints} pts a ${res.userName}!` 
      });
      setScannedToken("");
      setTimeout(() => setScannerStatus({ type: 'idle' }), 5000);
    } catch (err: any) {
      setScannerStatus({ 
        type: 'error', 
        message: err.message || "Token inválido o expirado" 
      });
      setScannedToken("");
      setTimeout(() => setScannerStatus({ type: 'idle' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = activeToken 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${activeToken.token}&color=000000&bgcolor=FFFFFF`
    : null;

  return (
    <div className="min-h-screen bg-boston-black text-white p-6 pb-24">
      <header className="mb-8 flex items-center gap-4">
        <Link href="/admin" className="p-2 bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black uppercase italic tracking-tight">Generador de Regalos</h1>
      </header>

      {/* CALCULATOR TOOL - NEW */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 glass-panel p-6 rounded-[2.5rem] border border-boston-gold/20 bg-gradient-to-br from-[#0a0a0a] to-[#111]"
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
           <div className="flex items-center gap-4 shrink-0">
             <div className="w-14 h-14 bg-boston-gold/10 rounded-2xl flex items-center justify-center border border-boston-gold/20 shadow-[0_0_20px_rgba(204,166,80,0.1)]">
               <RotateCcw className="w-7 h-7 text-boston-gold" />
             </div>
             <div>
               <h2 className="text-lg font-black uppercase italic tracking-tighter">Calculadora Express</h2>
               <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">Genera puntos por consumo</p>
             </div>
           </div>

           <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Total Gastado ($)</label>
                <input 
                  type="text" 
                  value={spentAmount === "" ? "" : formatWithDots(spentAmount)}
                  onChange={(e) => setSpentAmount(e.target.value === "" ? "" : parseSmartNumber(e.target.value))}
                  placeholder="Ej: 150k"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold focus:border-boston-gold/50 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">% a Premiar</label>
                <div className="flex items-center gap-3">
                   <input 
                    type="range"
                    min="1"
                    max="50"
                    value={rewardPercentage}
                    onChange={(e) => setRewardPercentage(Number(e.target.value))}
                    className="flex-1 accent-boston-gold"
                  />
                  <span className="text-sm font-black text-boston-gold w-10 text-right">{rewardPercentage}%</span>
                </div>
              </div>
              <div className="flex items-end gap-3">
                 <div className="flex-1 bg-white/5 border border-white/5 rounded-xl py-3 px-4 flex justify-between items-center">
                    <span className="text-[9px] font-black text-white/20 uppercase">Total:</span>
                    <span className="text-sm font-black text-green-500">{calculatedPoints} PTS</span>
                 </div>
                 <button 
                  onClick={applyCalculated}
                  disabled={!spentAmount}
                  className="p-3.5 bg-boston-gold text-black rounded-xl hover:bg-yellow-600 transition-all disabled:opacity-30 active:scale-90"
                 >
                   <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LIGHTNING QR CARD */}
        <motion.div className="glass-panel p-6 rounded-[2rem] border border-boston-red/20 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-boston-red/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-boston-red-glow" />
              </div>
              <h3 className="font-bold uppercase tracking-wider">QR Relámpago</h3>
            </div>
            <p className="text-[10px] text-white/50 mb-6 uppercase tracking-widest font-bold">Un solo uso • Tiempo limitado</p>
            
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Puntos a Regalar</label>
                  {spentAmount && calculatedPoints === lightningPoints && (
                    <span className="text-[8px] font-bold text-boston-gold uppercase">Calculado ✓</span>
                  )}
                </div>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-boston-gold/50" />
                  <input 
                    type="text" 
                    value={formatWithDots(lightningPoints)}
                    onChange={(e) => setLightningPoints(parseSmartNumber(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:border-boston-red/50 outline-none transition-colors"
                  />
                </div>
              </div>

              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Duración (Minutos)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="number" 
                    value={lightningExpiry}
                    onChange={(e) => setLightningExpiry(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:border-boston-red/50 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={() => generateToken("SINGLE_USE", lightningPoints, lightningExpiry)}
            className="w-full py-4 bg-boston-red text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/20"
          >
            Generar QR de {formatWithDots(lightningPoints)} Puntos
          </button>
        </motion.div>

        {/* DAILY CHECKIN CARD */}
        <motion.div className={`glass-panel p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between transition-colors duration-500 ${isEventDay ? 'border-boston-gold bg-boston-gold/10' : 'border-white/5'}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-boston-gold/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-boston-gold" />
                </div>
                <h3 className="font-bold uppercase tracking-wider">Check-in Mesa</h3>
              </div>
              {/* Event Day Toggle */}
              <button 
                onClick={() => setIsEventDay(!isEventDay)}
                className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${isEventDay ? 'bg-boston-gold text-black border-boston-gold' : 'bg-transparent text-white/30 border-white/10 hover:border-white/20'}`}
              >
                {isEventDay ? '● Modo Evento ON' : 'Modo Evento OFF'}
              </button>
            </div>
            <p className="text-[10px] text-white/50 mb-6 uppercase tracking-widest font-bold">Uso recurrente • 24hs Cooldown</p>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Puntos Base</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-boston-gold/50" />
                    <input 
                      type="text" 
                      value={formatWithDots(dailyPoints)}
                      onChange={(e) => setDailyPoints(parseSmartNumber(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:border-boston-gold/50 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Puntos Evento</label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-boston-gold" />
                    <input 
                      type="text" 
                      value={formatWithDots(eventPoints)}
                      onChange={(e) => setEventPoints(parseSmartNumber(e.target.value))}
                      className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-colors ${isEventDay ? 'border-boston-gold' : 'border-white/10 opacity-50'}`}
                    />
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-xl border transition-colors ${isEventDay ? 'bg-boston-gold/20 border-boston-gold/30' : 'bg-white/5 border-white/5'}`}>
                 <p className="text-[9px] leading-relaxed italic font-bold">
                   {isEventDay 
                    ? `¡MODO EVENTO ACTIVO! Los socios ganarán ${formatWithDots(eventPoints)} puntos hoy.` 
                    : `Los socios reclamarán ${formatWithDots(dailyPoints)} puntos normalmente cada 24 horas.`}
                 </p>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={() => generateToken("DAILY_CHECKIN", dailyPoints, null)}
            className={`w-full py-4 font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 shadow-lg ${isEventDay ? 'bg-white text-black hover:bg-white/90' : 'bg-boston-gold text-black hover:bg-yellow-600'}`}
          >
            {isEventDay ? `Generar QR Evento (${formatWithDots(eventPoints)} Pts)` : `Generar QR Normal (${formatWithDots(dailyPoints)} Pts)`}
          </button>
        </motion.div>

        {/* PHYSICAL SCANNER CARD */}
        <motion.div 
          className={`glass-panel p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between border-boston-gold/40 bg-boston-gold/5`}
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-boston-gold/20 rounded-xl flex items-center justify-center border border-boston-gold/30">
                <QrCode className="w-5 h-5 text-boston-gold" />
              </div>
              <h3 className="font-bold uppercase tracking-wider">Escáner de Carnet</h3>
            </div>
            <p className="text-[10px] text-white/50 mb-6 uppercase tracking-widest font-bold italic">Usá el escáner físico para sumar puntos</p>
            
            <form onSubmit={handlePhysicalScan} className="space-y-6 mb-4">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Puntos a Sumar</label>
                 <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-boston-gold/50" />
                    <input 
                      type="text" 
                      value={formatWithDots(scannerPoints)}
                      onChange={(e) => setScannerPoints(parseSmartNumber(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xl font-black text-boston-gold focus:border-boston-gold/50 outline-none transition-colors"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-boston-gold uppercase tracking-[0.2em] ml-1">Esperando lectura del escáner...</label>
                 <div className={`relative transition-all duration-300 ${scannerStatus.type === 'success' ? 'scale-105' : ''}`}>
                    <input 
                      type="text" 
                      autoFocus
                      value={scannedToken}
                      onChange={(e) => setScannedToken(e.target.value)}
                      placeholder="ESCANEÁ EL QR..."
                      className={`w-full bg-black/50 border-2 rounded-2xl py-10 px-6 text-center text-2xl font-black tracking-[0.3em] outline-none transition-all ${
                        scannerStatus.type === 'success' ? 'border-green-500 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 
                        scannerStatus.type === 'error' ? 'border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 
                        'border-boston-gold/30 focus:border-boston-gold text-white'
                      }`}
                    />
                    {loading && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <RotateCcw className="w-6 h-6 animate-spin text-boston-gold" />
                      </div>
                    )}
                 </div>
              </div>

              <div className="h-12 flex items-center justify-center">
                 <AnimatePresence mode="wait">
                    {scannerStatus.type !== 'idle' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`text-[10px] font-black uppercase tracking-widest text-center px-6 py-3 rounded-xl border ${scannerStatus.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                      >
                        {scannerStatus.message}
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>
            </form>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-3">
             <Info className="w-4 h-4 text-white/20" />
             <p className="text-[9px] text-white/30 font-bold uppercase text-center leading-relaxed">
               El carnet del socio debe estar abierto en su perfil
             </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-black font-black py-4 px-8 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.4)] flex items-center gap-3 border-2 border-white/20"
          >
            <Check className="w-5 h-5" />
            <span className="uppercase text-xs tracking-widest leading-none">Ajustes Sincronizados con Pantalla</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeToken && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 overflow-y-auto"
          >
            <div className="w-full max-w-sm flex flex-col items-center">
              <div className="bg-white p-8 rounded-[3rem] shadow-[0_0_80px_rgba(255,255,255,0.1)] relative group">
                <img src={qrUrl!} alt="Generated Promo QR" className="w-64 h-64 rounded-xl" />
                <div className="absolute -top-4 -right-4 bg-black text-boston-gold font-black px-4 py-2 rounded-full border-2 border-boston-gold shadow-xl rotate-12 scale-110">
                  {formatWithDots(activeToken.points)} PTS
                </div>
              </div>

              <div className="mt-10 w-full text-center space-y-6">
                <div>
                  <h4 className="text-white font-black text-xl uppercase tracking-tighter italic">
                    {activeToken.type === 'SINGLE_USE' ? 'Código Relámpago Listo' : 'Código de Mesa Listo'}
                  </h4>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 space-x-2">
                    {activeToken.type === 'SINGLE_USE' ? (
                      <span className="text-boston-red-glow">● Expira en {activeToken.expiresAt ? new Date(activeToken.expiresAt).toLocaleTimeString() : 'N/A'}</span>
                    ) : (
                      <span className="text-green-500">● Código Permanente</span>
                    )}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                  <code className="text-[10px] text-white/40 break-all">{activeToken.token}</code>
                  <button onClick={copyToClipboard} className="shrink-0 p-2 hover:bg-white/10 rounded-lg">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button 
                  onClick={() => setActiveToken(null)}
                  className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cerrar y Generar Otro
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
