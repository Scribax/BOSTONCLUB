"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckCircle2, XCircle, Loader2, RefreshCcw, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";

type HistoryItem = {
  id: string;
  time: string;
  scannedByName: string;
  userName: string;
  type: string;
  details: string;
};

export default function AdminScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [successDetails, setSuccessDetails] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    // Only initialize scanner if there is no pending result
    if (scanResult) return;

    let scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.clear();
        processScan(decodedText);
      },
      (error) => {
        // Ignored errors for continuous scanning
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanResult]);

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

  const processScan = async (text: string) => {
    setStatus("LOADING");
    setErrorMessage(null);
    try {
      const res = await apiFetch('/redemptions/confirm', {
        method: "POST",
        body: JSON.stringify({ qrToken: text })
      });
      setSuccessDetails(res.details);
      setStatus("SUCCESS");
      fetchHistory(); // Refresh history
    } catch (error: any) {
      setErrorMessage(error.message || "QR Inválido o Expirado");
      setStatus("ERROR");
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setStatus("IDLE");
    setSuccessDetails(null);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Scanner Section */}
      <div>
        <header className="mb-6">
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">Escáner QR</h1>
          <p className="text-white/50 text-sm">Escanea para validar canjes</p>
        </header>

        {!scanResult ? (
          <div className="glass-panel p-4 rounded-3xl border border-white/10 overflow-hidden">
            <div id="reader" className="w-full bg-black rounded-2xl overflow-hidden [&>video]:object-cover" />
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center animate-in zoom-in duration-300">
            {status === "LOADING" && (
              <div className="flex flex-col items-center py-10">
                <Loader2 className="w-12 h-12 text-boston-gold animate-spin mb-4" />
                <p className="text-white font-bold tracking-widest uppercase text-sm">Validando Token...</p>
              </div>
            )}

            {status === "SUCCESS" && (
              <div className="flex flex-col items-center py-6">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                   <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-white font-black text-2xl uppercase mb-1">¡Canje Exitoso!</h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full my-4">
                  <p className="text-boston-gold text-xs font-black uppercase tracking-widest mb-1">Premio Obtenido:</p>
                  <p className="text-white font-bold text-lg">{successDetails}</p>
                </div>
                <button 
                  onClick={resetScanner}
                  className="bg-boston-gold text-black font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl hover:brightness-110 transition-all w-full mt-2"
                >
                  Escanear Otro
                </button>
              </div>
            )}

            {status === "ERROR" && (
              <div className="flex flex-col items-center py-6">
                <div className="w-20 h-20 bg-boston-red/20 rounded-full flex items-center justify-center mb-4 border border-boston-red/50 shadow-[0_0_30px_rgba(208,0,0,0.3)]">
                   <XCircle className="w-10 h-10 text-boston-red-glow" />
                </div>
                <h2 className="text-white font-black text-2xl uppercase mb-1">Error</h2>
                <p className="text-white/60 text-sm mb-6">{errorMessage}</p>
                <button 
                  onClick={resetScanner}
                  className="bg-transparent border border-white/20 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl hover:bg-white/5 transition-colors w-full"
                >
                  Intentar Nuevamente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Section */}
      <div>
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Historial Hoy</h2>
            <p className="text-white/50 text-sm">Validaciones de las últimas 24hs</p>
          </div>
          <button onClick={fetchHistory} disabled={loadingHistory} className="p-2 hover:bg-white/5 rounded-full transition-all">
            <RefreshCcw className={`w-5 h-5 text-white/40 ${loadingHistory ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 h-[500px] flex flex-col">
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
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
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
  );
}
