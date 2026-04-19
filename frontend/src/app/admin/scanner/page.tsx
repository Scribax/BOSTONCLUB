"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AdminScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");

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

  const processScan = async (text: string) => {
    setStatus("LOADING");
    try {
      // API call to confirm redemption would go here
      // const res = await fetch('/api/redemptions/confirm', { method: "POST", body: ... })
      setTimeout(() => setStatus("SUCCESS"), 1500); // Mock delay
    } catch (error) {
      setStatus("ERROR");
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setStatus("IDLE");
  };

  return (
    <div className="max-w-md mx-auto">
      <header className="mb-6 text-center">
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
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/50">
                 <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-white font-black text-2xl uppercase mb-1">¡Canje Exitoso!</h2>
              <p className="text-white/60 text-sm mb-6">El premio ha sido validado correctamente.</p>
              <button 
                onClick={resetScanner}
                className="bg-white text-black font-bold uppercase tracking-wider text-sm px-8 py-3 rounded-xl hover:scale-105 transition-transform"
              >
                Escanear Otro
              </button>
            </div>
          )}

          {status === "ERROR" && (
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 bg-boston-red/20 rounded-full flex items-center justify-center mb-4 border border-boston-red/50">
                 <XCircle className="w-10 h-10 text-boston-red-glow" />
              </div>
              <h2 className="text-white font-black text-2xl uppercase mb-1">Error</h2>
              <p className="text-white/60 text-sm mb-6">QR Inválido o Expirado.</p>
              <button 
                onClick={resetScanner}
                className="bg-transparent border border-white/20 text-white font-bold uppercase tracking-wider text-sm px-8 py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                Intentar Nuevamente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
