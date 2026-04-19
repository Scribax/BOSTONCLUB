"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Gift, Ticket, Save, X, Utensils, Beer, Star, Edit3 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Reward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: string;
  isActive: boolean;
};

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [newType, setNewType] = useState("BEBIDA");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/rewards");
      setRewards(data);
    } catch (err) {
      console.error("Error fetching rewards", err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setNewName(reward.name);
    setNewDesc(reward.description);
    setNewPoints(reward.pointsRequired.toString());
    setNewType(reward.type);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingReward) {
        // Update
        const updated = await apiFetch(`/rewards/${editingReward.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: newName,
            description: newDesc,
            pointsRequired: parseInt(newPoints),
            type: newType
          })
        });
        setRewards(rewards.map(r => r.id === editingReward.id ? updated : r));
      } else {
        // Create
        const reward = await apiFetch("/rewards", {
          method: "POST",
          body: JSON.stringify({
            name: newName,
            description: newDesc,
            pointsRequired: parseInt(newPoints),
            type: newType
          })
        });
        setRewards([...rewards, reward]);
      }
      closeModal();
    } catch (err) {
      alert("Error al guardar premio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres dar de baja este premio?")) return;
    try {
      await apiFetch(`/rewards/${id}`, { method: "DELETE" });
      setRewards(rewards.filter(r => r.id !== id));
    } catch (err) {
      alert("Error al eliminar premio");
    }
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingReward(null);
    resetForm();
  };

  const resetForm = () => {
    setNewName("");
    setNewDesc("");
    setNewPoints("");
    setNewType("BEBIDA");
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">Catálogo de Premios</h1>
          <p className="text-white/50 text-sm">Gestiona los premios disponibles para los socios.</p>
        </div>
        <button 
          onClick={() => {
            setEditingReward(null);
            resetForm();
            setIsAdding(true);
          }}
          className="bg-boston-gold text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-boston-gold/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Premio
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSave}
              className="glass-panel p-6 rounded-[2rem] border border-boston-gold/30 bg-boston-gold/5 relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black text-sm uppercase tracking-widest">
                  {editingReward ? "Editar Premio" : "Añadir Nuevo"}
                </h3>
                <button type="button" onClick={closeModal} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1 block">Nombre del Premio</label>
                  <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Pinta de la Casa" className="w-full bg-black text-white border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-boston-gold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1 block">Descripción</label>
                  <input required value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ej: Válido para cualquier variedad" className="w-full bg-black text-white border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-boston-gold outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1 block">Puntos</label>
                    <input required type="number" value={newPoints} onChange={e => setNewPoints(e.target.value)} placeholder="500" className="w-full bg-black text-white border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-boston-gold outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1 block">Categoría</label>
                    <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-black text-white border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-boston-gold outline-none">
                      <option value="BEBIDA">Bebida</option>
                      <option value="COMIDA">Comida</option>
                      <option value="VIP">VIP / Acceso</option>
                    </select>
                  </div>
                </div>
                <button 
                  disabled={saving}
                  className="w-full bg-boston-gold text-black font-black uppercase text-xs tracking-widest py-4 rounded-2xl mt-4 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? "Guardando..." : <><Save className="w-4 h-4" /> {editingReward ? "Actualizar" : "Guardar"}</>}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="glass-panel h-48 rounded-[2rem] animate-pulse bg-white/5 border border-white/5" />)
        ) : (
          rewards.map((r, idx) => (
            <motion.div 
              key={r.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-6 rounded-[2rem] border border-white/5 group hover:border-white/10 transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${r.type === 'BEBIDA' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {r.type === 'BEBIDA' ? <Beer className="w-6 h-6" /> : <Utensils className="w-6 h-6" />}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEdit(r)}
                    className="p-2 text-white/20 hover:text-boston-gold transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(r.id)}
                    className="p-2 text-white/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-white font-black text-lg tracking-tight mb-1">{r.name}</h3>
              <p className="text-white/40 text-xs line-clamp-2 mb-6">{r.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-boston-gold/10 rounded-full border border-boston-gold/20">
                  <Star className="w-3 h-3 text-boston-gold fill-boston-gold" />
                  <span className="text-boston-gold font-black text-xs uppercase tracking-tighter">{r.pointsRequired} Puntos</span>
                </div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{r.type}</span>
              </div>
            </motion.div>
          ))
        )}

        {!loading && rewards.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center">
            <Gift className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 font-black uppercase text-xs tracking-widest">No hay premios cargados</p>
          </div>
        )}
      </div>
    </div>
  );
}
