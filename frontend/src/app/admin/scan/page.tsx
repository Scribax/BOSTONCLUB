"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, ShieldCheck, CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCcw, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type HistoryItem = {
  id: string;
  time: string;
  scannedByName: string;
  userName: string;
  type: string;
  details: string;
};

export default function AdminScanPage() {
  const [scanResult, setScanResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
  const [message, setMessage] = useState("");
  const [manualToken, setManualToken] = useState("");
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (status !== "IDLE") return; // Don't re-init if we have a result shown

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      setScanResult(decodedText);
      handleConfirm(decodedText);
      scanner.clear();
    }

    function onScanFailure(error: any) {
      // ignore
    }

    return () => {
      scanner.clear().catch(e => console.error("Scanner cleanup failed", e));
    };
  }, [status]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await apiFetch("/redemptions/history");
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConfirm = async (token: string) => {
    if (!token) return;
    setLoading(true);
    setStatus("IDLE");
    try {
      const data = await apiFetch("/redemptions/confirm", {
        method: "POST",
        body: JSON.stringify({ qrToken: token })
      });
      setStatus("SUCCESS");
      setMessage(data.details ? `Premio Obtenido: ${data.details}` : (data.message || "¡Canje exitoso!"));
      fetchHistory(); // Refresh history immediately
    } catch (err: any) {
      setStatus("ERROR");
      setMessage(err.message || "Error al validar el código");
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult("");
    setManualToken("");
    setStatus("IDLE");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="text-center mb-8">
        <div className="inline-flex p-3 bg-boston-red/10 rounded-2xl mb-4">
          <QrCode className="w-8 h-8 text-boston-red-glow" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-widest uppercase">Validar Canje</h1>
        <p className="text-white/50 text-sm">Escanea el QR del cliente para confirmar la entrega del premio.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT PANE: Scanner */}
        <div>
          <AnimatePresence mode="wait">
            {status === "IDLE" ? (
              <motion.div 
                key="scanner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5 bg-black p-2">
                   <div id="reader" className="w-full [&>video]:object-cover"></div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[.3em]">
                    <span className="bg-[#050505] px-4 text-white/20">O ingresa el código</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={manualToken}
                    onChange={e => setManualToken(e.target.value)}
                    placeholder="Token del QR..."
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-boston-gold transition-colors"
                  />
                  <button 
                    onClick={() => handleConfirm(manualToken)}
                    disabled={loading || !manualToken}
                    className="bg-white text-black px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-panel p-10 rounded-[3rem] border flex flex-col items-center text-center ${status === 'SUCCESS' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}
              >
                {status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                ) : (
                  <XCircle className="w-20 h-20 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                )}
                
                <h2 className={`text-2xl font-black uppercase tracking-tight mb-2 ${status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {status === 'SUCCESS' ? "¡Canje Confirmado!" : "Error de Validación"}
                </h2>
                
                {status === 'SUCCESS' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full my-4">
                    <p className="text-white font-bold text-lg">{message}</p>
                  </div>
                )}
                
                {status === 'ERROR' && (
                  <p className="text-white/70 font-medium mb-8 max-w-xs mx-auto">
                    {message}
                  </p>
                )}

                <button 
                  onClick={resetScanner}
                  className="mt-4 px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                >
                  Escanear otro <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PANE: History */}
        <div className="flex flex-col">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">Historial Hoy</h2>
              <p className="text-white/50 text-sm">Validaciones de las últimas 24hs</p>
            </div>
            <button onClick={fetchHistory} disabled={loadingHistory} className="p-2 hover:bg-white/5 rounded-full transition-all">
              <RefreshCcw className={`w-5 h-5 text-white/40 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </header>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex-1 min-h-[400px] flex flex-col">
            {loadingHistory && history.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-boston-gold animate-spin opacity-50" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                <Clock className="w-12 h-12 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Sin registros recientes</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 max-h-[500px]">
                {history.map(item => (
                  <div key={item.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-boston-gold">
                        {item.type === 'VIP_BENEFIT' ? 'Beneficio VIP' : item.type === 'REWARD' ? 'Premio Puntos' : 'Promo'}
                      </span>
                      <span className="text-[10px] font-bold text-white/40">
                        {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-white font-bold text-sm mb-1">{item.details}</p>
                    <div className="flex justify-between items-end mt-3 pt-3 border-t border-white/5">
                      <div>
                        <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-0.5">Socio</p>
                        <p className="text-[11px] text-white/80 font-medium">{item.userName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-0.5">Staff (Aprobó)</p>
                        <p className="text-[11px] text-white/80 font-medium italic">{item.scannedByName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="pt-8 border-t border-white/5">
        <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-boston-gold shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-wider">
            Al confirmar, la operación quedará registrada en el historial de auditoría bajo tu usuario para control.
          </p>
        </div>
      </footer>
    </div>
  );
}
