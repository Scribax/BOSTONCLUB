"use client";

import { useState, useEffect } from "react";
import { CalendarPlus, Image as ImageIcon, Trash2, Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";

type EventType = {
  id: string;
  title: string;
  description: string;
  details?: string;
  location?: string;
  eventDate: string;
  benefits?: string;
  type: string;
  imageUrl?: string;
  buttonText?: string;
  externalLink?: string;
  isActive: boolean;
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("Boston Club");
  const [eventDate, setEventDate] = useState("");
  const [benefits, setBenefits] = useState("");
  const [type, setType] = useState("EVENTO");
  const [buttonText, setButtonText] = useState("RESERVAR MESA");
  const [externalLink, setExternalLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await apiFetch("/events", { cache: "no-store", headers: { "Cache-Control": "no-cache" }});
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!title || !description || !eventDate) return alert("Título, Descripción Corta y Fecha son obligatorios");
    setIsSubmitting(true);
    
    try {
      await apiFetch("/events", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          details,
          location,
          eventDate: new Date(eventDate).toISOString(),
          benefits,
          type,
          buttonText,
          externalLink,
          imageUrl: imagePreview || null
        })
      });
      setTitle("");
      setDescription("");
      setDetails("");
      setBenefits("");
      setEventDate("");
      setExternalLink("");
      setImagePreview(null);
      fetchEvents();
      alert("Publicado con éxito. Se envió una notificación automática.");
    } catch (err) {
      alert("Error al crear evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este evento?")) return;
    try {
      await apiFetch(`/events/${id}`, { method: "DELETE" });
      setEvents(events.filter(event => event.id !== id));
    } catch (err) {
      alert("Error al eliminar evento");
    }
  };

  const handleNotify = async (id: string) => {
    if (!confirm("¿Deseas enviar una alerta PUSH manual a todos los usuarios con la App recordando este evento?")) return;
    try {
      await apiFetch(`/events/${id}/notify`, { method: "POST" });
      alert("Notificación Push enviada!");
    } catch (err) {
      alert("Error al enviar notificación manualmente.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-black text-white tracking-widest uppercase">Eventos y Banners</h1>
           <p className="text-white/50 text-sm">Gestiona la agenda y las promos del dashboard.</p>
        </div>
      </header>

      {/* Draft Creation Box */}
      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 mb-8">
         <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-boston-gold rounded-full flex items-center justify-center shadow-lg shadow-boston-gold/20">
               <CalendarPlus className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-white font-black tracking-widest uppercase text-base italic">Nueva Publicada VIP</h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Principal Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Título del Evento</label>
                   <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Noche de Stand Up" className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm" />
                </div>
                <div>
                   <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Fecha y Hora</label>
                   <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm" />
                </div>
              </div>

              <div>
                 <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Punchline (Descripción Corta)</label>
                 <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: ¡El show más esperado del año!" className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm" />
              </div>

              <div>
                 <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Detalles Extendidos</label>
                 <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe el evento, invitados, etc..." className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm h-32 resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Ubicación</label>
                   <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: VIP Main Stage" className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm" />
                </div>
                <div>
                   <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Etiqueta Beneficio</label>
                   <input type="text" value={benefits} onChange={(e) => setBenefits(e.target.value)} placeholder="Ej: 200 PTS EXTRA" className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-bold">
                 <div className="md:col-span-1">
                   <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Tipo</label>
                   <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm">
                     <option value="EVENTO">Evento</option>
                     <option value="BANNER">Banner</option>
                   </select>
                 </div>
                 <div className="md:col-span-1">
                   <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Texto Botón</label>
                   <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm" />
                 </div>
                 <div className="md:col-span-1">
                   <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block">Link (WhatsApp/Web)</label>
                   <input type="text" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://..." className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-2xl py-4 px-5 focus:border-boston-gold transition-all outline-none text-sm" />
                 </div>
              </div>
            </div>

            {/* Visual Part */}
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-2 block flex justify-between">
                    Imagen del Poster
                    <span className="text-boston-gold/60 lowercase italic font-medium">
                      Recomendado: {type === 'BANNER' ? '1200x400px' : '800x1200px'}
                    </span>
                  </label>
                  <label className={`w-full border border-dashed border-white/10 rounded-3xl py-10 flex flex-col items-center justify-center text-white/20 hover:bg-white/5 transition-all cursor-pointer overflow-hidden relative ${type === 'BANNER' ? 'aspect-[3/1]' : 'aspect-[3/4]'}`}>
                     <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                     {imagePreview ? (
                       // eslint-disable-next-line @next/next/no-img-element
                       <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover transition-all" />
                     ) : (
                       <>
                         <ImageIcon className="w-10 h-10 mb-4 text-white/10" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Subir Poster de Evento</span>
                       </>
                     )}
                     {imagePreview && (
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/60 font-black text-white uppercase text-[10px] tracking-widest">
                          Cambiar Imagen
                       </div>
                     )}
                  </label>
               </div>
               
               <button onClick={handlePublish} disabled={isSubmitting} className="w-full bg-boston-gold text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:brightness-110 disabled:opacity-50 shadow-xl shadow-boston-gold/10 transition-all active:scale-[0.98]">
                 {isSubmitting ? "Publicando..." : "Publicar Cartelera"}
               </button>
            </div>
         </div>
      </div>

      {/* Existing Events List */}
      <h2 className="text-white font-bold tracking-widest uppercase mb-4 text-sm mt-10">Agenda Activa</h2>
      <div className="glass-panel p-4 rounded-2xl border border-white/5 overflow-x-auto">
         <table className="w-full text-left min-w-[600px]">
           <thead>
             <tr className="border-b border-white/5 text-white/40 text-xs font-bold uppercase tracking-widest">
                <th className="pb-3 pl-4">Tipo</th>
                <th className="pb-3">Título</th>
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Etiqueta Beneficio</th>
                <th className="pb-3 text-right pr-4">Acciones</th>
             </tr>
           </thead>
           <tbody>
             {events.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-white/40">No hay eventos activos.</td></tr>
             )}
             {events.map((ev) => (
               <tr key={ev.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-4 pl-4">
                     <span className={`text-[10px] font-black px-2 py-1 rounded-sm uppercase ${ev.type === 'BANNER' ? 'bg-boston-red-glow text-white' : 'bg-boston-gold/20 text-boston-gold'}`}>
                        {ev.type}
                     </span>
                  </td>
                  <td className="py-4 text-white font-bold">{ev.title}</td>
                  <td className="py-4 text-white/60 text-sm">{ev.description}</td>
                  <td className="py-4 text-white/60 text-sm">{ev.benefits}</td>
                  <td className="py-4 pr-4">
                     <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => handleNotify(ev.id)}
                         title="Enviar Notificación (Alerta Push) a la App"
                         className="text-[#D4AF37] hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                       >
                         <Bell className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(ev.id)}
                         className="text-boston-red-glow hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                  </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
}
