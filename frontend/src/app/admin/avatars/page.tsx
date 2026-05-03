"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Smile, Save, X, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Avatar = {
  id: string;
  url: string;
  name?: string;
  createdAt: string;
};

export default function AdminAvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/avatars");
      setAvatars(data);
    } catch (err) {
      console.error("Error fetching avatars", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
        alert("Selecciona una imagen primero");
        return;
    }
    setSaving(true);
    try {
      // 1. Upload to Cloudflare R2
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const uploadRes = await apiFetch("/media/upload", {
        method: "POST",
        body: formData
      });
      
      if (!uploadRes.url) throw new Error("Upload failed");

      // 2. Create in DB
      const avatar = await apiFetch("/avatars", {
        method: "POST",
        body: JSON.stringify({
           url: uploadRes.url,
           name: newName || "Nuevo Avatar"
        })
      });
      
      setAvatars([avatar, ...avatars]);
      setIsAdding(false);
      resetForm();
      setMessage({ text: "Avatar subido con éxito", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Error saving avatar", err);
      alert("Error al guardar avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este avatar?")) return;
    try {
      await apiFetch(`/avatars/${id}`, { method: "DELETE" });
      setAvatars(avatars.filter(a => a.id !== id));
      setMessage({ text: "Avatar eliminado", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const resetForm = () => {
    setNewName("");
    setImagePreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase italic">Gestión de Avatares</h1>
          <p className="text-white/50 text-sm font-bold uppercase tracking-wider mt-1">Sube fotos personalizadas para los socios</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-boston-gold text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-boston-gold/20"
        >
          <Plus className="w-4 h-4" /> Subir Avatar
        </button>
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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSave}
              className="glass-panel p-6 rounded-[2rem] border border-boston-gold/30 bg-boston-gold/5 col-span-2"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Añadir Avatar</h3>
                <button type="button" onClick={() => setIsAdding(false)} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <label className={`w-full border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-white/20 hover:bg-white/5 transition-all cursor-pointer overflow-hidden relative aspect-square`}>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                    <>
                        <ImageIcon className="w-10 h-10 mb-2 text-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Subir Imagen</span>
                    </>
                    )}
                </label>

                <input 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="Nombre (opcional)" 
                    className="w-full bg-black text-white border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-boston-gold outline-none" 
                />

                <button 
                  disabled={saving}
                  className="w-full bg-boston-gold text-black font-black uppercase text-xs tracking-widest py-4 rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? "Subiendo..." : <><Save className="w-4 h-4" /> Guardar Avatar</>}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="glass-panel aspect-square rounded-[2rem] animate-pulse bg-white/5 border border-white/5" />)
        ) : (
          avatars.map((a, idx) => (
            <motion.div 
              key={a.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-2 rounded-[2rem] border border-white/5 relative group overflow-hidden"
            >
              <img src={a.url} alt="Avatar" className="w-full aspect-square object-cover rounded-[1.5rem]" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                 <button 
                    onClick={() => handleDelete(a.id)}
                    className="bg-red-500/20 text-red-500 p-3 rounded-full hover:bg-red-500 hover:text-white transition-all"
                 >
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-2">
                 <p className="text-white/40 text-[9px] font-black uppercase text-center truncate">{a.name}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
    </div>
  );
}
