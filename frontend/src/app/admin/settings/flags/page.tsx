"use client";

import { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight, Plus, Trash2, ShieldAlert } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type FeatureFlag = {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
  createdAt: string;
};

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");
  const [newFlagDescription, setNewFlagDescription] = useState("");
  const [newFlagEnabled, setNewFlagEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/flags");
      setFlags(data);
    } catch (err) {
      console.error("Error fetching flags", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setFlags(flags.map(f => f.id === id ? { ...f, enabled: !currentStatus } : f));
      
      await apiFetch(`/flags/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !currentStatus })
      });
    } catch (err) {
      alert("Error al cambiar estado del flag");
      // Revert on error
      fetchFlags();
    }
  };

  const handleDelete = async (flag: FeatureFlag) => {
    if (!confirm(`¿Estás seguro de eliminar el flag '${flag.name}'?`)) return;
    try {
      await apiFetch(`/flags/${flag.id}`, { method: "DELETE" });
      setFlags(flags.filter(f => f.id !== flag.id));
    } catch (err) {
      alert("Error al eliminar el flag");
    }
  };

  const handleCreate = async () => {
    if (!newFlagName) return;
    setIsSubmitting(true);
    try {
      const data = await apiFetch("/flags", {
        method: "POST",
        body: JSON.stringify({
          name: newFlagName,
          description: newFlagDescription,
          enabled: newFlagEnabled
        })
      });
      setFlags([data, ...flags]);
      setIsModalOpen(false);
      setNewFlagName("");
      setNewFlagDescription("");
      setNewFlagEnabled(false);
    } catch (err: any) {
      alert(err.message || "Error al crear el flag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">Feature Flags</h1>
          <p className="text-white/50 text-sm">Gestiona funcionalidades de la app en tiempo real.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-boston-red-glow text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-boston-red-glow/20"
        >
          <Plus className="w-4 h-4" /> 
          Nuevo Flag
        </button>
      </header>

      <div className="glass-panel p-4 rounded-3xl border border-white/5 overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-white/30 animate-pulse">Cargando banderas...</div>
        ) : (
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                <th className="pb-4 pl-4">Flag</th>
                <th className="pb-4">Descripción</th>
                <th className="pb-4 text-center">Estado</th>
                <th className="pb-4 text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr key={flag.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                  <td className="py-5 pl-4">
                    <p className="text-white font-bold tracking-widest text-sm">{flag.name}</p>
                  </td>
                  <td className="py-5">
                    <p className="text-white/50 text-xs max-w-sm">{flag.description || "Sin descripción"}</p>
                  </td>
                  <td className="py-5 text-center">
                    <button 
                      onClick={() => toggleFlag(flag.id, flag.enabled)}
                      className="group relative inline-flex items-center justify-center"
                    >
                      {flag.enabled ? (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                          <ToggleRight className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">ON</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-white/30 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                          <ToggleLeft className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">OFF</span>
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="py-5 pr-4 text-right">
                    <button 
                      onClick={() => handleDelete(flag)}
                      title="Eliminar Flag"
                      className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {(!loading && flags.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <ShieldAlert className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-white/20 uppercase font-black tracking-widest text-xs">No hay feature flags configuradas</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0c0c0c] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
            >
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6">Nuevo Flag</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2 block">Nombre del Flag</label>
                  <input 
                    type="text" 
                    value={newFlagName}
                    onChange={(e) => setNewFlagName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="ej: enable_referrals"
                    className="w-full bg-black text-white border border-white/10 rounded-xl py-3 px-4 text-sm font-bold focus:border-boston-gold transition-all outline-none"
                  />
                  <p className="text-[9px] text-white/30 mt-1">Solo minúsculas, números y guiones bajos (_)</p>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2 block">Descripción</label>
                  <input 
                    type="text" 
                    value={newFlagDescription}
                    onChange={(e) => setNewFlagDescription(e.target.value)}
                    placeholder="¿Para qué sirve este flag?"
                    className="w-full bg-black text-white border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-boston-gold transition-all outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="initialState"
                    checked={newFlagEnabled}
                    onChange={(e) => setNewFlagEnabled(e.target.checked)}
                    className="w-4 h-4 accent-boston-gold cursor-pointer"
                  />
                  <label htmlFor="initialState" className="text-xs text-white/80 font-bold uppercase tracking-widest cursor-pointer">
                    Activar por defecto
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="py-3 rounded-xl bg-white/5 text-white/50 font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreate}
                    disabled={isSubmitting || !newFlagName}
                    className="py-3 rounded-xl bg-boston-red-glow text-white font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Creando..." : "Crear Flag"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
