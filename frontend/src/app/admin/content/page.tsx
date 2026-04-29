"use client";

import { useState, useEffect } from "react";
import { 
  Layout, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Tag, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Check, 
  Upload, 
  Loader2, 
  Smartphone,
  Sparkles,
  Bell,
  Eye,
  Ticket,
  Save,
  LogIn,
  QrCode,
  ShieldCheck,
  RefreshCcw,
  Zap,
  PlayCircle,
  GripVertical
} from "lucide-react";
import { apiFetch, API_URL, getAuthToken } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ContentItem = {
  id: string;
  title: string;
  description: string;
  details?: string;
  location?: string;
  eventDate?: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType: string; // 'IMAGE' or 'VIDEO'
  order: number;
  isActive: boolean;
  type: 'BANNER' | 'EVENTO' | 'PROMO' | 'EVENT';
  benefits?: string;
  buttonText?: string;
  externalLink?: string;
  isAdultOnly: boolean;
  content?: string;
  gallery?: string;
  // Redemption Logic
  isRedeemable: boolean;
  redemptionPolicy: string;
  benefitType: string | null;
  benefitValue: string | null;
  secondaryImageUrl?: string;
  secondaryMediaType?: 'IMAGE' | 'VIDEO';
  linkedEventId?: string;
};

export default function AppContentManager() {
  const [activeTab, setActiveTab] = useState<'BANNER' | 'EVENTO' | 'PROMO' | 'GLOBAL'>('BANNER');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("Boston Club");
  const [eventDate, setEventDate] = useState("");
  const [benefits, setBenefits] = useState("");
  const [mediaType, setMediaType] = useState("IMAGE");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [buttonText, setButtonText] = useState("RESERVAR MESA");
  const [externalLink, setExternalLink] = useState("");
  const [isAdultOnly, setIsAdultOnly] = useState(false);
  const [content, setContent] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [secondaryImageUrl, setSecondaryImageUrl] = useState("");
  const [secondaryMediaType, setSecondaryMediaType] = useState<'IMAGE' | 'VIDEO'>("IMAGE");
  const [linkedEventId, setLinkedEventId] = useState("");
  // Redemption Form State
  const [isRedeemable, setIsRedeemable] = useState(false);
  const [redemptionPolicy, setRedemptionPolicy] = useState("ONCE_TOTAL");
  const [benefitType, setBenefitType] = useState<string>("TWO_FOR_ONE");
  const [benefitValue, setBenefitValue] = useState("");

  useEffect(() => {
    fetchContent();
    fetchGlobalSettings();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/events");
      // Normalize 'EVENT' to 'EVENTO' for frontend UI consistency
      const normalized = data.map((item: any) => ({
        ...item,
        type: item.type === 'EVENT' ? 'EVENTO' : item.type
      }));
      setItems(normalized);
    } catch (err) {
      console.error("Error fetching content", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex((item) => item.id === active.id);
    const newIndex = filteredItems.findIndex((item) => item.id === over.id);

    const newFilteredItems = arrayMove(filteredItems, oldIndex, newIndex);
    
    // Update local state for all items
    const updatedItems = items.map(item => {
        const foundIndex = newFilteredItems.findIndex(ni => ni.id === item.id);
        if (foundIndex !== -1) {
            return { ...item, order: foundIndex };
        }
        return item;
    });

    setItems(updatedItems);

    // Save to backend
    try {
        const orders = newFilteredItems.map((item, index) => ({
            id: item.id,
            order: index
        }));
        await apiFetch("/events/reorder", {
            method: "PATCH",
            body: JSON.stringify({ orders })
        });
    } catch (err) {
        console.error("Error reordering", err);
        fetchContent(); // Rollback
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchGlobalSettings = async () => {
    try {
      const data = await apiFetch("/settings");
      setGlobalSettings(data);
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  const filteredItems = items
    .filter(item => item.type === activeTab)
    .sort((a, b) => {
        if (activeTab === 'BANNER') return a.order - b.order;
        if (activeTab === 'EVENTO') return new Date(a.eventDate || '').getTime() - new Date(b.eventDate || '').getTime();
        return a.order - b.order;
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGlobal: boolean = false, isSecondary: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    const isGlobalUpload = isGlobal && activeTab === 'GLOBAL';
    const isVideo = isGlobalUpload || (isSecondary ? secondaryMediaType === 'VIDEO' : mediaType === 'VIDEO');
    formData.append(isGlobalUpload ? "video" : "file", file);

    try {
      const token = getAuthToken();
      const endpoint = isGlobalUpload ? `${API_URL}/settings/upload-video` : `${API_URL}/media/upload`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      
      if (isGlobal && activeTab === 'GLOBAL') {
        setGlobalSettings({ ...globalSettings, loginVideoUrl: data.url });
        alert("¡Video de Login cargado!");
      } else if (isSecondary) {
        setSecondaryImageUrl(data.url);
      } else {
        if (mediaType === "IMAGE") {
          setImageUrl(data.url);
        } else {
          setVideoUrl(data.url);
        }
      }
    } catch (err) {
      alert("Error al subir archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveGlobal = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch("/settings", {
        method: "POST",
        body: JSON.stringify(globalSettings)
      });
      alert("¡Video de Login guardado con éxito!");
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!title || !description) return alert("Título y descripción son obligatorios");
    
    setIsSubmitting(true);
    const payload = {
      title,
      description,
      details,
      location,
      eventDate: eventDate ? new Date(eventDate).toISOString() : null,
      benefits,
      mediaType,
      imageUrl: mediaType === "IMAGE" ? imageUrl : (imageUrl || null),
      videoUrl: mediaType === "VIDEO" ? videoUrl : (videoUrl || null),
      type: activeTab,
      buttonText,
      externalLink,
      isAdultOnly,
      content,
      gallery: JSON.stringify(gallery),
      isActive: true,
      order: editingItem ? editingItem.order : items.filter(i => i.type === activeTab).length,
      // Redemption Logic
      isRedeemable,
      redemptionPolicy,
      benefitType: isRedeemable ? benefitType : null,
      benefitValue: isRedeemable ? benefitValue : null,
      secondaryImageUrl,
      secondaryMediaType,
      linkedEventId: linkedEventId || null
    };

    try {
      if (editingItem) {
        await apiFetch(`/events/${editingItem.id}`, {
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
      resetForm();
      fetchContent();
    } catch (err) {
      alert("Error al guardar contenido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este elemento?")) return;
    try {
      await apiFetch(`/events/${id}`, { method: "DELETE" });
      fetchContent();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const handleNotify = async (id: string) => {
    if (!confirm("¿Enviar notificación push a todos los usuarios?")) return;
    try {
      await apiFetch(`/events/${id}/notify`, { method: "POST" });
      alert("¡Notificación enviada!");
    } catch (err) {
      alert("Error al enviar notificación");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setDetails("");
    setLocation("Boston Club");
    setEventDate("");
    setBenefits("");
    setMediaType("IMAGE");
    setImageUrl("");
    setVideoUrl("");
    setButtonText(activeTab === 'BANNER' ? 'VER MÁS' : 'RESERVAR MESA');
    setExternalLink("");
    setIsAdultOnly(false);
    setContent("");
    setGallery([]);
    setIsRedeemable(false);
    setRedemptionPolicy("ONCE_TOTAL");
    setBenefitType("TWO_FOR_ONE");
    setBenefitValue("");
    setSecondaryImageUrl("");
    setSecondaryMediaType("IMAGE");
    setLinkedEventId("");
  };

  const openEdit = (item: ContentItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setDetails(item.details || "");
    setLocation(item.location || "Boston Club");
    setEventDate(item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 16) : "");
    setBenefits(item.benefits || "");
    setMediaType(item.mediaType);
    setImageUrl(item.imageUrl || "");
    setVideoUrl(item.videoUrl || "");
    setButtonText(item.buttonText || "RESERVAR MESA");
    setExternalLink(item.externalLink || "");
    setIsAdultOnly(item.isAdultOnly);
    setContent(item.content || "");
    try {
      setGallery(item.gallery ? JSON.parse(item.gallery) : []);
    } catch {
      setGallery([]);
    }
    // Redemption Logic
    setIsRedeemable(item.isRedeemable);
    setRedemptionPolicy(item.redemptionPolicy || "ONCE_TOTAL");
    setBenefitType(item.benefitType || "TWO_FOR_ONE");
    setBenefitValue(item.benefitValue || "");
    setSecondaryImageUrl(item.secondaryImageUrl || "");
    setSecondaryMediaType((item.secondaryMediaType as 'IMAGE' | 'VIDEO') || "IMAGE");
    setLinkedEventId(item.linkedEventId || "");
    setShowModal(true);
  };

  const getFullUrl = (url: string | undefined | null) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    return `${API_URL.replace('/api', '')}${url}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left side: Manager */}
      <div className="flex-1 space-y-8">
        <header>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase italic">Gestión de App</h1>
          <p className="text-white/40 text-sm mt-2 font-bold uppercase tracking-wider">Control Editorial y Visual</p>
        </header>

        {/* Unified Tabs */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto">
           {[
             { id: 'BANNER', label: 'Banners Hero', icon: Layout },
             { id: 'EVENTO', label: 'Agenda VIP', icon: Calendar },
             { id: 'PROMO', label: 'Promos Cards', icon: Tag },
             { id: 'GLOBAL', label: 'Fondo Login', icon: LogIn }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-black text-[9px] min-w-fit uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-boston-gold text-black shadow-lg shadow-boston-gold/20' : 'text-white/40 hover:text-white'}`}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
             </button>
           ))}
        </div>

        {/* Content List */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 min-h-[600px]">
           {activeTab === 'GLOBAL' ? (
             <div className="space-y-10">
                <div className="flex items-center justify-between">
                   <h2 className="text-white font-black tracking-widest uppercase text-base italic">Video de Fondo (Login)</h2>
                   <button 
                     onClick={handleSaveGlobal} 
                     disabled={isSubmitting} 
                     className="bg-boston-gold text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-boston-gold/20 flex items-center gap-2"
                   >
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Guardar Cambios
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <p className="text-white/40 text-xs leading-relaxed">Este video se reproduce en bucle en la pantalla de inicio de la App. Da la primera impresión a los socios antes de entrar.</p>
                      
                      <label className={`w-full border-2 border-dashed border-white/10 rounded-3xl py-20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all relative overflow-hidden ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                         <input type="file" accept="video/mp4" className="hidden" onChange={(e) => handleFileUpload(e, true)} />
                         {isUploading ? <Loader2 className="w-10 h-10 text-boston-gold animate-spin" /> : (
                           globalSettings?.loginVideoUrl ? (
                             <div className="flex flex-col items-center gap-4">
                                <Video className="w-12 h-12 text-green-500" />
                                <span className="text-[10px] font-black text-white/60 uppercase">¡Video Cargado!</span>
                                <span className="text-[8px] text-white/20 uppercase tracking-widest">Click para cambiar</span>
                             </div>
                           ) : (
                             <>
                                <Upload className="w-10 h-10 text-white/5 mb-4" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Subir Video MP4</span>
                             </>
                           )
                         )}
                      </label>
                      <p className="text-center text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Recomendado: 1080x1920 (Vertical) • Máx 20MB</p>
                   </div>

                   <div className="bg-black rounded-[2rem] border border-white/5 overflow-hidden aspect-[9/16] relative shadow-2xl">
                      {globalSettings?.loginVideoUrl ? (
                        <video src={getFullUrl(globalSettings.loginVideoUrl)} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-10">
                           <ImageIcon className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                         <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] border border-white/10 px-6 py-2 rounded-full">PREVIEW LOGIN</span>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <>
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-white font-black tracking-widest uppercase text-base italic">
                    {activeTab === 'BANNER' ? 'Banners Superiores' : (activeTab === 'EVENTO' ? 'Próximos Eventos' : 'Tarjetas de Promoción')}
                  </h2>
                  <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-boston-red text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-boston-red/20"
                  >
                    <Plus className="w-4 h-4 inline mr-2" /> Nuevo {activeTab}
                  </button>
               </div>

               {loading ? (
                 <div className="flex flex-col items-center justify-center py-32 opacity-20">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <span className="font-black uppercase text-[10px] tracking-[0.3em]">Cargando Contenido...</span>
                 </div>
               ) : filteredItems.length === 0 ? (
                 <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                    <Sparkles className="w-12 h-12 text-white/5 mx-auto mb-4" />
                    <p className="text-white/20 uppercase font-black text-[10px] tracking-widest">No hay {activeTab} configurados</p>
                 </div>
               ) : (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={filteredItems.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                      disabled={activeTab === 'EVENTO'}
                    >
                      <div className="space-y-4">
                        {filteredItems.map((item) => (
                          <SortableItem 
                            key={item.id} 
                            item={item} 
                            activeTab={activeTab} 
                            getFullUrl={getFullUrl} 
                            openEdit={openEdit} 
                            handleDelete={handleDelete} 
                            handleNotify={handleNotify} 
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
             </>
           )}
        </div>
      </div>

      {/* Right side: Mobile Preview */}
      <div className="w-full lg:w-96 space-y-6">
         <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl sticky top-8">
            <h3 className="text-white font-black tracking-widest uppercase text-[10px] italic mb-6 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-boston-gold" /> Vista Previa App
            </h3>
            
            <div className="aspect-[9/19] w-full bg-[#050505] rounded-[3rem] border-[8px] border-[#1a1a1a] overflow-hidden relative shadow-2xl">
               <div className="absolute top-0 w-full h-full">
                  {activeTab === 'GLOBAL' ? (
                    <div className="w-full h-full relative">
                        {globalSettings?.loginVideoUrl ? (
                          <video src={getFullUrl(globalSettings.loginVideoUrl)} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                        ) : (
                          <div className="w-full h-full bg-zinc-900" />
                        )}
                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center p-8">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl mb-4" />
                            <div className="h-6 w-32 bg-white/20 rounded-full mb-2" />
                            <div className="h-4 w-40 bg-white/5 rounded-full" />
                            <div className="mt-auto w-full h-12 bg-boston-red rounded-xl" />
                        </div>
                    </div>
                  ) : (
                    <>
                      {/* Banners Area */}
                      <div className={`w-full ${activeTab === 'BANNER' ? 'h-[60%] border-2 border-boston-gold/50' : 'h-[60%] bg-zinc-900'} flex items-center justify-center relative`}>
                        {items.find(i => i.type === 'BANNER') ? (
                          <img src={getFullUrl(items.find(i => i.type === 'BANNER')?.imageUrl)} className="w-full h-full object-cover opacity-60" />
                        ) : (
                          <div className="items-center flex flex-col gap-2 opacity-10">
                              <ImageIcon className="w-10 h-10" />
                              <span className="text-[6px] font-black uppercase tracking-widest">Main Hero</span>
                          </div>
                        )}
                        <div className="absolute bottom-8 left-4">
                            <div className="bg-white px-2 py-0.5 rounded-sm mb-1 self-start">
                              <span className="text-black font-black text-[7px] uppercase italic">¡HOLA!</span>
                            </div>
                            <div className="h-3 w-24 bg-white/20 rounded-full mb-1" />
                        </div>
                      </div>

                      {/* Loyalty/Menu Area */}
                      <div className="p-4 bg-[#050505]">
                        <div className="h-14 w-full bg-boston-red/5 border border-white/5 rounded-[1.5rem] mb-4" />
                        
                        <div className={`flex gap-2 p-2 rounded-xl mb-4 ${activeTab === 'EVENTO' ? 'border border-boston-gold/50' : ''}`}>
                            {[1, 2, 3].map(i => <div key={i} className="h-10 flex-1 bg-white/5 rounded-lg" />)}
                        </div>

                        {/* Promo Section Preview */}
                        <div className={`p-2 rounded-xl ${activeTab === 'PROMO' ? 'border border-boston-gold/50' : ''}`}>
                            <div className="h-2 w-16 bg-white/10 rounded mb-2" />
                            <div className="flex gap-2">
                              <div className="h-20 w-[80%] bg-[#0c0c0c] border border-white/5 rounded-2xl p-2 flex-row flex">
                                  <div className="flex-1 justify-center flex flex-col gap-1">
                                    <div className="h-3 w-8 bg-white/20 rounded" />
                                    <div className="h-2 w-12 bg-white/5 rounded" />
                                  </div>
                                  <div className="w-12 h-full bg-white/5 rounded-lg" />
                              </div>
                            </div>
                        </div>
                      </div>
                    </>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Modal: Universal Content Form */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-panel w-full max-w-5xl p-10 rounded-[3rem] border border-white/10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto" >
               <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingItem ? 'Editar Contenido' : `Nuevo ${activeTab}`}</h2>
                    <p className="text-boston-gold text-[10px] font-black uppercase tracking-widest mt-1">Configuración Editorial</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all"><X className="w-6 h-6 text-white/40" /></button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-6">
                    <div>
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Título</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: ¡NOCHE DE BURGERS!" className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm font-bold uppercase" />
                    </div>
                    <div>
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Descripción Corta</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Disfruta un 2x1 toda la noche" className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm" />
                    </div>
                    {activeTab === 'EVENTO' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Fecha</label>
                           <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm" />
                        </div>
                        <div>
                           <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Lugar</label>
                           <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm" />
                        </div>
                      </div>
                    )}
                    <div>
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Tipo de Multimedia</label>
                        <div className="flex gap-4">
                          <button onClick={() => setMediaType("IMAGE")} className={`flex-1 py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${mediaType === "IMAGE" ? 'bg-boston-gold text-black border-boston-gold' : 'bg-white/5 text-white/40 border-white/10'}`}><ImageIcon className="w-4 h-4" /> Imagen</button>
                          <button onClick={() => setMediaType("VIDEO")} className={`flex-1 py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${mediaType === "VIDEO" ? 'bg-boston-red text-white border-boston-red' : 'bg-white/5 text-white/40 border-white/10'}`}><Video className="w-4 h-4" /> Video</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Multimedia Principal</label>
                        <div className="relative group">
                          <label className={`w-full border-2 border-dashed border-white/10 rounded-3xl py-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all relative overflow-hidden ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input type="file" accept={mediaType === 'IMAGE' ? "image/*" : "video/mp4"} className="hidden" onChange={handleFileUpload} />
                            {isUploading ? <Loader2 className="w-10 h-10 text-boston-gold animate-spin" /> : (
                              (mediaType === 'IMAGE' ? imageUrl : videoUrl) ? (
                                <div className="flex flex-col items-center gap-2"><Check className="w-8 h-8 text-green-500" /><span className="text-[8px] text-white/30 truncate max-w-[200px]">{(mediaType === 'IMAGE' ? imageUrl : videoUrl)}</span></div>
                              ) : (
                                <><Upload className="w-8 h-8 text-white/10 mb-2" /><span className="text-[10px] font-black text-white/40 uppercase">Subir Archivo</span></>
                              )
                            )}
                          </label>
                          {(mediaType === 'IMAGE' ? imageUrl : videoUrl) && (
                            <button 
                              onClick={() => mediaType === 'IMAGE' ? setImageUrl("") : setVideoUrl("")}
                              className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all z-20"
                              title="Eliminar Multimedia"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Sparkles className="w-3 h-3 text-boston-gold" /> Tamaños Recomendados
                           </p>
                           <ul className="space-y-1">
                              <li className="text-[8px] text-white/20 uppercase font-bold">• Banners Hero: 1080x1920 (Vertical)</li>
                              <li className="text-[8px] text-white/20 uppercase font-bold">• Promos/Eventos: 1080x1350 (Vertical 4:5)</li>
                              <li className="text-[8px] text-white/20 uppercase font-bold">• Videos: MP4 • Máx 20MB</li>
                           </ul>
                        </div>
                    </div>
                  </div>

                  {/* Middle Column: Detailed Content */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em]">Multimedia Secundaria (Interior)</label>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                <button onClick={() => setSecondaryMediaType('IMAGE')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${secondaryMediaType === 'IMAGE' ? 'bg-white text-black' : 'text-white/40'}`}>Imagen</button>
                                <button onClick={() => setSecondaryMediaType('VIDEO')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${secondaryMediaType === 'VIDEO' ? 'bg-white text-black' : 'text-white/40'}`}>Video</button>
                            </div>
                        </div>
                        <div className="relative group">
                          <label className={`w-full border-2 border-dashed border-white/10 rounded-3xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all relative overflow-hidden ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input type="file" accept={secondaryMediaType === 'IMAGE' ? "image/*" : "video/mp4"} className="hidden" onChange={(e) => handleFileUpload(e, false, true)} />
                            {isUploading ? <Loader2 className="w-8 h-8 text-boston-gold animate-spin" /> : (
                              secondaryImageUrl ? (
                                <div className="flex flex-col items-center gap-2"><Check className="w-6 h-6 text-boston-gold" /><span className="text-[7px] text-white/30 truncate max-w-[200px]">{secondaryImageUrl}</span></div>
                              ) : (
                                <>{secondaryMediaType === 'IMAGE' ? <ImageIcon className="w-6 h-6 text-white/5 mb-2" /> : <PlayCircle className="w-6 h-6 text-white/5 mb-2" />}<span className="text-[9px] font-black text-white/20 uppercase">Subir {secondaryMediaType === 'IMAGE' ? 'Imagen' : 'Video'}</span></>
                              )
                            )}
                          </label>
                          {secondaryImageUrl && (
                            <button 
                              onClick={() => setSecondaryImageUrl("")}
                              className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-all z-20"
                              title="Eliminar Multimedia"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Contenido Detallado (Página Interior)</label>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Explica los detalles de la promo o evento..." className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm min-h-[250px] resize-none leading-relaxed" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Texto del Botón</label>
                        <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-3 block">Link Externo (Opcional)</label>
                        <input type="text" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://..." className="w-full bg-black/50 text-white border border-white/10 rounded-2xl py-4 px-6 focus:border-boston-gold transition-all outline-none text-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex items-center gap-3">
                          <Ticket className="w-5 h-5 text-boston-gold" />
                          <div><p className="text-white font-black text-[10px] uppercase tracking-widest">Restricción +18</p><p className="text-[8px] text-white/30 uppercase">¿Solo adultos?</p></div>
                       </div>
                       <button onClick={() => setIsAdultOnly(!isAdultOnly)} className={`w-12 h-6 rounded-full relative transition-all ${isAdultOnly ? 'bg-boston-red' : 'bg-white/10'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAdultOnly ? 'right-1' : 'left-1'}`} /></button>
                    </div>
                  </div>

                  {/* Right Column: Redemption Logic */}
                  <div className="space-y-6">
                     <div className={`p-6 rounded-[2rem] border transition-all ${isRedeemable ? 'bg-boston-gold/5 border-boston-gold/20 shadow-lg shadow-boston-gold/5' : 'bg-white/5 border-white/5 opacity-40'}`}>
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                              <QrCode className={`w-6 h-6 ${isRedeemable ? 'text-boston-gold' : 'text-white/20'}`} />
                              <div>
                                 <h3 className="text-white font-black text-[11px] uppercase tracking-widest italic">Sistema de Canje</h3>
                                 <p className="text-[8px] text-white/30 uppercase font-bold">Activar código QR único</p>
                              </div>
                           </div>
                           <button onClick={() => setIsRedeemable(!isRedeemable)} className={`w-14 h-7 rounded-full relative transition-all ${isRedeemable ? 'bg-boston-gold' : 'bg-white/10'}`}>
                              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${isRedeemable ? 'right-1' : 'left-1'}`} />
                           </button>
                        </div>

                        {isRedeemable && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                             <div>
                                <label className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-3 block">Política de Redención</label>
                                <div className="grid grid-cols-1 gap-2">
                                   {[
                                     { id: 'ONCE_TOTAL', label: 'Una sola vez', icon: ShieldCheck },
                                     { id: 'ONCE_PER_NIGHT', label: 'Una vez por noche', icon: RefreshCcw },
                                     { id: 'UNLIMITED', label: 'Ilimitado', icon: Zap }
                                   ].map(policy => (
                                     <button 
                                       key={policy.id} 
                                       onClick={() => setRedemptionPolicy(policy.id)}
                                       className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${redemptionPolicy === policy.id ? 'bg-white text-black border-white' : 'bg-black/20 text-white/40 border-white/5 hover:border-white/20'}`}
                                     >
                                        <policy.icon className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{policy.label}</span>
                                     </button>
                                   ))}
                                </div>
                             </div>

                             <div>
                                <label className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-3 block">Tipo de Beneficio</label>
                                <select 
                                  value={benefitType} 
                                  onChange={(e) => setBenefitType(e.target.value)}
                                  className="w-full bg-black/50 text-white border border-white/10 rounded-xl py-3 px-4 focus:border-boston-gold outline-none text-[10px] font-black uppercase tracking-widest"
                                >
                                   <option value="TWO_FOR_ONE">2x1 (Double)</option>
                                   <option value="PERCENTAGE">% de Descuento</option>
                                   <option value="FIXED">Monto Fijo ($)</option>
                                   <option value="FREE">Gratis / Consumición</option>
                                </select>
                             </div>

                             <div>
                                <label className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-3 block">Valor del Beneficio</label>
                                <input 
                                  type="text" 
                                  value={benefitValue} 
                                  onChange={(e) => setBenefitValue(e.target.value)} 
                                  placeholder="Ej: 2x1 en Gin, 20%, Fernet Gratis..." 
                                  className="w-full bg-black/50 text-white border border-white/10 rounded-xl py-3 px-4 focus:border-boston-gold outline-none text-[10px] font-bold uppercase" 
                                />
                             </div>
                          </motion.div>
                        )}
                     </div>

                     <div className="mt-4 p-6 bg-white/5 rounded-[2rem] border border-white/5">
                         <label className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-4 block">Vincular con Evento (Opcional)</label>
                         <div className="relative">
                           <select 
                             value={linkedEventId} 
                             onChange={(e) => setLinkedEventId(e.target.value)}
                             className="w-full bg-black/50 text-white border border-white/10 rounded-xl py-4 px-5 focus:border-boston-gold outline-none text-[10px] font-black uppercase tracking-widest appearance-none transition-all cursor-pointer"
                           >
                               <option value="">Ninguno</option>
                               {items.filter(i => i.type === 'EVENT' || i.type === 'EVENTO').map(ev => (
                                 <option key={ev.id} value={ev.id}>{ev.title}</option>
                               ))}
                           </select>
                           <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/20">
                               <Plus className="w-4 h-4" />
                           </div>
                         </div>
                     </div>

                     <button 
                       onClick={handleSave} 
                       disabled={isSubmitting || isUploading} 
                       className="w-full bg-boston-gold text-black py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-boston-gold/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                     >
                        {isSubmitting ? "Guardando..." : (editingItem ? 'Guardar Cambios' : 'Crear Publicación')}
                     </button>
                     
                     <p className="text-[8px] text-white/20 font-medium text-center uppercase tracking-widest leading-relaxed px-4">
                        Al activar el canje, los usuarios verán un botón para generar un código QR único que el staff deberá escanear.
                     </p>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableItem({ item, activeTab, getFullUrl, openEdit, handleDelete, handleNotify }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white/[0.02] border border-white/5 p-4 rounded-3xl flex items-center gap-5 group hover:bg-white/5 transition-all ${!item.isActive ? 'opacity-60 border-red-500/10' : ''}`}
    >
      {activeTab !== 'EVENTO' && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-white/10 hover:text-white/40 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      <div className="w-24 h-24 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
          {item.imageUrl ? (
            <img src={getFullUrl(item.imageUrl)} className={`w-full h-full object-cover ${!item.isActive ? 'grayscale' : 'opacity-60'}`} />
          ) : (
            <ImageIcon className="w-6 h-6 text-white/10" />
          )}
      </div>
      
      <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-black text-sm uppercase italic tracking-tighter ${!item.isActive ? 'text-white/40' : 'text-white'}`}>{item.title}</h3>
            {item.isActive ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <span className="text-[7px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">DESACTIVADO</span>
            )}
            {item.isRedeemable && <QrCode className={`w-3 h-3 ${!item.isActive ? 'text-boston-gold/30' : 'text-boston-gold'}`} />}
          </div>
          <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest line-clamp-1">{item.description}</p>
          <div className="flex items-center gap-3 mt-3">
            {activeTab === 'EVENTO' && (
              <span className="bg-white/5 px-2 py-1 rounded text-[8px] text-white/50 font-black uppercase">{item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'Sin Fecha'}</span>
            )}
            <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${item.mediaType === 'VIDEO' ? 'bg-boston-red text-white' : 'bg-white/10 text-white/40'}`}>{item.mediaType}</span>
            {item.isRedeemable && <span className="bg-boston-gold/10 text-boston-gold px-2 py-1 rounded text-[8px] font-black uppercase">REDEEMABLE</span>}
          </div>
      </div>

      <div className="flex items-center gap-2">
          <button onClick={() => handleNotify(item.id)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/30 hover:text-boston-gold transition-all">
            <Bell className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(item)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-all">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item.id)} className="w-9 h-9 bg-boston-red/5 rounded-xl flex items-center justify-center text-boston-red/40 hover:text-boston-red transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
}
