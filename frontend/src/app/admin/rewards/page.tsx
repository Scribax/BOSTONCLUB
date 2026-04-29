"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Gift, Ticket, Save, X, Utensils, Beer, Star, Edit3, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Reward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: string;
  imageUrl?: string;
  isActive: boolean;
  isAdultOnly: boolean;
};

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  // Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [newType, setNewType] = useState("BEBIDA");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAdultOnly, setIsAdultOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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

  // Move a reward to the top of the list (making it the "featured" one in the mobile app)
  const handleToggleFeatured = async (reward: Reward) => {
    const isAlreadyFeatured = rewards[0]?.id === reward.id;
    if (isAlreadyFeatured) return; // already featured, nothing to do
    try {
      // Reorder: put this reward first, then keep the rest
      const newOrder = [reward, ...rewards.filter(r => r.id !== reward.id)];
      setRewards(newOrder); // optimistic update
      await apiFetch("/rewards/reorder", {
        method: "PATCH",
        body: JSON.stringify({ orders: newOrder.map((r, i) => ({ id: r.id, order: i })) })
      });
    } catch (err) {
      alert("Error al destacar premio");
      fetchRewards(); // revert on error
    }
  };

  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setNewName(reward.name);
    setNewDesc(reward.description);
    setNewPoints(reward.pointsRequired.toString());
    setNewType(reward.type);
    setImagePreview(reward.imageUrl || null);
    setIsAdultOnly(reward.isAdultOnly || false);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
         name: newName,
         description: newDesc,
         pointsRequired: parseInt(newPoints),
         type: newType,
         imageUrl: imagePreview || null,
         isAdultOnly: isAdultOnly
      };
      
      if (editingReward) {
        // Update
        const updated = await apiFetch(`/rewards/${editingReward.id}`, {
          method: "PATCH",
          body: JSON.stringify(body)
        });
        setRewards(rewards.map(r => r.id === editingReward.id ? updated : r));
      } else {
        // Create
        const reward = await apiFetch("/rewards", {
          method: "POST",
          body: JSON.stringify(body)
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

  const handleDelete = async (reward: Reward) => {
    const action = reward.isActive ? "desactivar" : "eliminar permanentemente";
    if (!confirm(`¿Seguro que quieres ${action} este premio?`)) return;
    
    try {
      const res = await apiFetch(`/rewards/${reward.id}`, { method: "DELETE" });
      
      if (res.message?.includes("permanentemente")) {
        setRewards(rewards.filter(r => r.id !== reward.id));
        setMessage({ text: "Premio eliminado permanentemente", type: 'success' });
      } else {
        // Just deactivated
        fetchRewards();
        setMessage({ text: res.message || "Premio desactivado", type: 'success' });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Error al procesar la solicitud";
      setMessage({ text: errorMsg, type: 'error' });
      setTimeout(() => setMessage(null), 5000);
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
    setImagePreview(null);
    setIsAdultOnly(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase italic">Catálogo de Premios</h1>
          <p className="text-white/50 text-sm font-bold uppercase tracking-wider mt-1">Gestión de Recompensas</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showInactive ? 'bg-white/10 text-white' : 'bg-transparent text-white/30 border border-white/10 hover:text-white'}`}
          >
            {showInactive ? "Ocultar Desactivados" : "Ver Desactivados"}
          </button>
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
        </div>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl mb-6 font-black text-[10px] uppercase tracking-widest text-center ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}
        >
          {message.text}
        </motion.div>
      )}

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

                <div className="grid grid-cols-1 gap-4 pt-2">
                   <div>
                      <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block flex justify-between">
                        Foto del Premio
                        <span className="text-boston-gold/60 lowercase italic font-medium">
                          Recomendado: 800x800px (1:1)
                        </span>
                      </label>
                      <label className={`w-full border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/20 hover:bg-white/5 transition-all cursor-pointer overflow-hidden relative aspect-video h-32`}>
                         <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                         {imagePreview ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover transition-all" />
                         ) : (
                           <>
                             <ImageIcon className="w-8 h-8 mb-2 text-white/10" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Subir Foto</span>
                           </>
                         )}
                      </label>
                   </div>
                   <div className="flex items-center">
                     <label className="flex items-center cursor-pointer select-none">
                        <div className="relative">
                           <input type="checkbox" checked={isAdultOnly} onChange={(e) => setIsAdultOnly(e.target.checked)} className="sr-only" />
                           <div className={`box block h-6 w-10 rounded-full transition-colors ${isAdultOnly ? 'bg-boston-red-glow' : 'bg-white/10'}`}></div>
                           <div className={`absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition-transform ${isAdultOnly ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <div className="ml-3">
                           <span className="text-[11px] font-black uppercase tracking-widest text-white/80">
                             {isAdultOnly ? "Restringido +18" : "Todos los públicos"}
                           </span>
                        </div>
                     </label>
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
          rewards
            .filter(r => showInactive ? true : r.isActive)
            .map((r, idx) => (
            <motion.div 
              key={r.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-panel p-6 rounded-[2rem] border group hover:border-white/10 transition-all relative overflow-hidden ${
                !r.isActive ? 'opacity-40 grayscale-[0.5]' : ''
              } ${
                idx === 0 && r.isActive ? 'border-boston-gold/40 shadow-lg shadow-boston-gold/10' : 'border-white/5'
              }`}
            >
              {/* Deactivated Badge */}
              {!r.isActive && (
                <div className="absolute top-4 left-4 z-20 bg-red-600 text-white px-3 py-1 rounded-full border border-red-500/50 shadow-lg">
                  <span className="text-[9px] font-black uppercase tracking-widest italic">DESACTIVADO</span>
                </div>
              )}

              {/* Featured badge */}
              {idx === 0 && r.isActive && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-boston-gold text-black px-3 py-1 rounded-full">
                  <Star className="w-3 h-3 fill-black" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Destacado en App</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-4 relative z-10" style={{ marginTop: (idx === 0 || !r.isActive) ? '28px' : '0' }}>
                <div className="flex flex-col gap-2">
                   <div className={`p-3 rounded-xl self-start ${r.type === 'BEBIDA' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                     {r.type === 'BEBIDA' ? <Beer className="w-6 h-6" /> : <Utensils className="w-6 h-6" />}
                   </div>
                   {r.isAdultOnly && (
                     <span className="text-[10px] font-black px-2 py-0.5 rounded-sm uppercase bg-red-600/30 text-red-400 border border-red-500/50 self-start">
                       +18
                     </span>
                   )}
                </div>
                <div className="flex gap-2">
                  {/* Highlight button - only show if not already featured and active */}
                  {idx !== 0 && r.isActive && (
                    <button 
                      onClick={() => handleToggleFeatured(r)}
                      title="Destacar en app"
                      className="p-2 text-white bg-black/60 rounded-lg hover:text-boston-gold hover:bg-black/80 transition-colors"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => openEdit(r)}
                    className="p-2 text-white bg-black/60 rounded-lg hover:text-boston-gold hover:bg-black/80 transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(r)}
                    className={`p-2 text-white bg-black/60 rounded-lg transition-colors ${r.isActive ? 'hover:text-red-500' : 'hover:text-red-600 border border-red-500/20'}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-white font-black text-lg tracking-tight mb-1 relative z-10">{r.name}</h3>
              <p className="text-white/40 text-xs line-clamp-2 mb-6 relative z-10">{r.description}</p>
              
              {r.imageUrl && (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={r.imageUrl} alt="Reward" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none mix-blend-lighten" />
              )}
              
              <div className="flex items-center justify-between relative z-10">
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
