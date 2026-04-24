"use client";

import { useState, useEffect } from "react";
import { Monitor, Layout, Image as ImageIcon, Video, Save, Plus, Trash2, ArrowUp, ArrowDown, X, Check, Upload, Loader2 } from "lucide-react";
import { apiFetch, API_URL, getAuthToken } from "@/lib/api";

type Banner = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType: string; // 'IMAGE' or 'VIDEO'
  order: number;
  isActive: boolean;
};

export default function DashboardSettingsPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("IMAGE");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await apiFetch("/events?type=BANNER");
      setBanners(data.sort((a: Banner, b: Banner) => a.order - b.order));
    } catch (err) {
      console.error("Error fetching banners", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      if (mediaType === "IMAGE") {
        setImageUrl(data.url);
      } else {
        setVideoUrl(data.url);
      }
    } catch (err) {
      alert("Error al subir archivo");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !description) return alert("Título y descripción son obligatorios");
    if (mediaType === "IMAGE" && !imageUrl) return alert("Debes subir una imagen");
    if (mediaType === "VIDEO" && !videoUrl) return alert("Debes subir un video");

    setIsSubmitting(true);
    
    const payload = {
      title,
      description,
      mediaType,
      imageUrl: mediaType === "IMAGE" ? imageUrl : null,
      videoUrl: mediaType === "VIDEO" ? videoUrl : null,
      type: "BANNER",
      isActive: true,
      order: editingBanner ? editingBanner.order : banners.length
    };

    try {
      if (editingBanner) {
        await apiFetch(`/events/${editingBanner.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/events", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      setEditingBanner(null);
      resetForm();
      fetchBanners();
    } catch (err) {
      alert("Error al guardar banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este banner?")) return;
    try {
      await apiFetch(`/events/${id}`, { method: "DELETE" });
      fetchBanners();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    // Actualizar órdenes en el servidor
    try {
      await Promise.all(newBanners.map((b, idx) => 
        apiFetch(`/events/${b.id}`, {
          method: "PATCH",
          body: JSON.stringify({ order: idx })
        })
      ));
      setBanners(newBanners);
    } catch (err) {
      console.error("Error updating order", err);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMediaType("IMAGE");
    setImageUrl("");
    setVideoUrl("");
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description);
    setMediaType(banner.mediaType);
    setImageUrl(banner.imageUrl || "");
    setVideoUrl(banner.videoUrl || "");
    setShowModal(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase italic">Configuración Dashboard</h1>
          <p className="text-white/50 text-sm mt-2 font-bold uppercase tracking-wider">Rediseño Boston Club v2</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-boston-gold/10 rounded-2xl flex items-center justify-center border border-boston-gold/20">
                    <Layout className="w-6 h-6 text-boston-gold" />
                  </div>
                  <h2 className="text-white font-black tracking-widest uppercase text-xl italic">Banners Carrusel Hero</h2>
               </div>
               <button 
                onClick={() => { resetForm(); setEditingBanner(null); setShowModal(true); }}
                className="bg-boston-gold text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-boston-gold/20"
               >
                  <Plus className="w-4 h-4 inline mr-2" /> Nuevo Banner
               </button>
            </div>

            <div className="space-y-4">
               {banners.length === 0 ? (
                 <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 uppercase font-black text-[10px] tracking-widest">No hay banners activos</p>
                 </div>
               ) : (
                 banners.map((banner, index) => (
                   <div key={banner.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl flex items-center gap-6 group hover:bg-white/5 transition-all">
                      <div className="flex flex-col gap-2">
                        <button 
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="text-white/10 hover:text-boston-gold transition-colors disabled:opacity-0"
                        >
                          <ArrowUp className="w-5 h-5" />
                        </button>
                        <button 
                          disabled={index === banners.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="text-white/10 hover:text-boston-gold transition-colors disabled:opacity-0"
                        >
                          <ArrowDown className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="w-40 h-24 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center relative group-hover:border-boston-gold/30 transition-all shadow-inner">
                        {banner.mediaType === 'VIDEO' ? (
                          <div className="flex flex-col items-center gap-1">
                            <Video className="w-8 h-8 text-boston-red-glow/40" />
                            <span className="text-[8px] font-black text-boston-red-glow/60 uppercase">MP4 Video</span>
                          </div>
                        ) : (
                          banner.imageUrl ? (
                            <img src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `https://mybostonclub.com${banner.imageUrl}`} className="w-full h-full object-cover opacity-60" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-white/10" />
                          )
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-lg text-[8px] font-black text-white/80 uppercase">
                          {banner.mediaType}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="text-white font-black text-base uppercase tracking-tighter italic">{banner.title}</h3>
                           {banner.isActive && <Check className="w-4 h-4 text-green-500" />}
                        </div>
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest line-clamp-1">{banner.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => openEdit(banner)}
                          className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Layout className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(banner.id)}
                          className="w-10 h-10 bg-boston-red/10 rounded-xl flex items-center justify-center text-boston-red-glow/60 hover:text-boston-red-glow hover:bg-boston-red/20 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-boston-gold rounded-full opacity-5 blur-[60px]" />
              <h3 className="text-white font-black tracking-widest uppercase text-sm italic mb-8 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> App Preview V2
              </h3>
              
              <div className="aspect-[9/19] w-full bg-[#050505] rounded-[3.5rem] border-[10px] border-[#1a1a1a] overflow-hidden relative shadow-2xl scale-[1.02]">
                 <div className="absolute top-0 w-full h-full">
                    {/* Banners Area */}
                    <div className="w-full h-[65%] bg-zinc-900 flex items-center justify-center relative">
                       {banners.length > 0 && banners[0].mediaType === 'IMAGE' && banners[0].imageUrl ? (
                         <img src={banners[0].imageUrl.startsWith('http') ? banners[0].imageUrl : `https://mybostonclub.com${banners[0].imageUrl}`} className="w-full h-full object-cover opacity-60" />
                       ) : (
                         <div className="items-center flex flex-col gap-3">
                            <ImageIcon className="w-12 h-12 text-white/5" />
                            <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Main Banner Slot</span>
                         </div>
                       )}
                       <div className="absolute bottom-10 left-6">
                          <div className="bg-white px-3 py-1 rounded-sm mb-2 self-start">
                             <span className="text-black font-black text-[9px] uppercase italic">¡HOLA, FRANCO!</span>
                          </div>
                          <div className="h-4 w-32 bg-white/20 rounded-full mb-1" />
                          <div className="h-4 w-24 bg-white/10 rounded-full" />
                       </div>
                    </div>
                    {/* Progress Area */}
                    <div className="p-6 bg-[#050505]">
                       <div className="h-20 w-full bg-boston-red/10 border border-boston-red/20 rounded-[2rem] mb-6" />
                       <div className="flex gap-4">
                          <div className="h-16 flex-1 bg-white/5 rounded-2xl" />
                          <div className="h-16 flex-1 bg-white/5 rounded-2xl" />
                          <div className="h-16 flex-1 bg-white/5 rounded-2xl" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowModal(false)} />
           <div className="glass-panel w-full max-w-2xl p-10 rounded-[3rem] border border-white/10 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                   {editingBanner ? 'Editar Banner' : 'Nuevo Banner Premium'}
                 </h2>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                    <X className="w-6 h-6 text-white/40" />
                 </button>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Título Principal (Bold)</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: ¡CUIDADO! PIDIENDO BOSTON..." className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm font-bold uppercase" />
                 </div>

                 <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Bajada / Punchline</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Podés terminar siendo socio diamante" className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm" />
                 </div>

                 <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Tipo de Multimedia</label>
                    <div className="flex gap-4">
                       <button onClick={() => setMediaType("IMAGE")} className={`flex-1 py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${mediaType === "IMAGE" ? 'bg-boston-gold text-black border-boston-gold' : 'bg-white/5 text-white/40 border-white/10'}`}>
                          <ImageIcon className="w-4 h-4" /> Imagen
                       </button>
                       <button onClick={() => setMediaType("VIDEO")} className={`flex-1 py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${mediaType === "VIDEO" ? 'bg-boston-red-glow text-white border-boston-red-glow' : 'bg-white/5 text-white/40 border-white/10'}`}>
                          <Video className="w-4 h-4" /> Video MP4
                       </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Subir Archivo ({mediaType === 'IMAGE' ? 'Imagen' : 'Video'})</label>
                    
                    <label className={`w-full border-2 border-dashed border-white/10 rounded-3xl py-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all relative overflow-hidden ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                       <input type="file" accept={mediaType === 'IMAGE' ? "image/*" : "video/mp4"} className="hidden" onChange={handleFileUpload} />
                       
                       {isUploading ? (
                         <Loader2 className="w-10 h-10 text-boston-gold animate-spin" />
                       ) : (
                         (mediaType === 'IMAGE' ? imageUrl : videoUrl) ? (
                           <div className="flex flex-col items-center gap-3">
                              <Check className="w-8 h-8 text-green-500" />
                              <span className="text-[10px] font-black text-white/60 uppercase">¡Archivo Subido!</span>
                              <span className="text-[8px] text-white/30 truncate max-w-[200px]">{(mediaType === 'IMAGE' ? imageUrl : videoUrl)}</span>
                           </div>
                         ) : (
                           <>
                              <Upload className="w-10 h-10 text-white/10 mb-4" />
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Click para subir {mediaType === 'IMAGE' ? 'Imagen' : 'Video'}</span>
                           </>
                         )
                       )}
                    </label>
                    
                    <p className="text-[9px] text-white/20 italic font-medium uppercase text-center tracking-widest">
                       {mediaType === 'IMAGE' ? "Recomendado: Vertical (1080x1920)" : "Máximo: 150MB - Formato: MP4"}
                    </p>
                 </div>

                 <div className="pt-6">
                    <button 
                      onClick={handleSave}
                      disabled={isSubmitting || isUploading}
                      className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 ${mediaType === 'VIDEO' ? 'bg-boston-red-glow text-white shadow-boston-red/20' : 'bg-boston-gold text-black shadow-boston-gold/20'}`}
                    >
                      {isSubmitting ? "Guardando..." : "Guardar Banner"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
