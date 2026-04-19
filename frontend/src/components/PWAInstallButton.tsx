"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Handle Android/Chrome Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  return (
    <>
      <div className="space-y-4">
        {/* Android / Chrome Prompt */}
        {deferredPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-5 rounded-3xl border border-boston-gold/30 bg-gradient-to-br from-boston-gold/10 to-transparent flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-boston-gold rounded-2xl flex items-center justify-center shadow-lg shadow-boston-gold/20">
                  <Smartphone className="text-black w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-white font-black text-sm uppercase italic">Instalar App Oficial</h4>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-tight">Accede más rápido desde tu inicio</p>
               </div>
            </div>
            <button 
              onClick={handleInstallClick}
              className="bg-white text-black text-[10px] font-black uppercase px-5 py-3 rounded-xl hover:bg-boston-gold transition-colors active:scale-95"
            >
              Instalar
            </button>
          </motion.div>
        )}

        {/* iOS Manual Guide Button */}
        {isIOS && !deferredPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-5 rounded-3xl border border-boston-gold/30 bg-gradient-to-br from-boston-gold/10 to-transparent flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-boston-gold rounded-2xl flex items-center justify-center">
                  <Download className="text-black w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-white font-black text-sm uppercase italic">Descargar para iPhone</h4>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-tight">Usa el sistema sin navegar</p>
               </div>
            </div>
            <button 
              onClick={() => setShowIOSGuide(true)}
              className="bg-white text-black text-[10px] font-black uppercase px-5 py-3 rounded-xl hover:bg-boston-gold transition-colors"
            >
              Cómo
            </button>
          </motion.div>
        )}
      </div>

      {/* iOS Modal Guide */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>

              <div className="text-center mb-10">
                 <div className="w-20 h-20 bg-boston-gold rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-10 h-10 text-black" />
                 </div>
                 <h3 className="text-2xl font-black text-white italic uppercase mb-2">Instalar en iOS</h3>
                 <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Sigue estos pasos para llevar a Boston Club en tu iPhone</p>
              </div>

              <div className="space-y-6 mb-10">
                 <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-boston-gold font-black text-sm shrink-0">1</div>
                    <div className="text-white/70 text-sm">
                      Toca el botón <Share className="inline w-4 h-4 text-boston-gold mx-1" /> **Compartir** en la barra inferior de Safari.
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-boston-gold font-black text-sm shrink-0">2</div>
                    <div className="text-white/70 text-sm">
                      Desliza hacia arriba y selecciona <PlusSquare className="inline w-4 h-4 text-boston-gold mx-1" /> **Agregar al Inicio**.
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-boston-gold transition-colors"
              >
                ¡Entendido!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
