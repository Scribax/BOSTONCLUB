"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CalendarDays, Ticket, Sparkles } from "lucide-react";
import Link from "next/link";
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
  createdAt: string;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiFetch("/events");
        const cleanData = data.filter((e: any) => e.type !== "BANNER" && e.isActive !== false);
        setEvents(cleanData);
      } catch (e) {
        console.error("Error loading events");
      }
    };
    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-AR", { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleAction = (event: EventType) => {
    if (event.externalLink) {
      window.open(event.externalLink, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-boston-black pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-4 py-4 flex items-center gap-4 bg-boston-black/80 backdrop-blur-xl">
        <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <h2 className="text-white text-lg font-black tracking-widest uppercase italic">Cartelera VIP</h2>
        </div>
      </header>

      <main className="px-6 pt-8">
        {/* Featured Section Info */}
        <div className="mb-10 relative overflow-hidden p-8 rounded-[2.5rem] border border-boston-gold/20 bg-gradient-to-br from-boston-gold/10 to-transparent">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-boston-gold rounded-full filter blur-[60px] opacity-10 pointer-events-none" />
           <p className="text-boston-gold font-black text-[10px] uppercase tracking-[0.4em] mb-3 leading-none">The Experience</p>
           <h3 className="text-white font-black text-3xl uppercase leading-none tracking-tighter mb-3">La Agenda del Club</h3>
           <p className="text-white/40 text-xs leading-relaxed font-medium">Eventos exclusivos, cenas show y noches de gala pensadas para nuestra comunidad.</p>
        </div>

        {events.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <CalendarDays className="w-12 h-12 mb-4" />
              <p className="uppercase font-black tracking-[0.3em] text-xs">No hay eventos confirmados</p>
           </div>
        )}

        <div className="grid grid-cols-1 gap-10">
          {events.map((ev, idx) => (
            <motion.div 
              key={ev.id}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="group relative"
            >
              <div 
                className="w-full aspect-[3/4] relative rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                onClick={() => setSelectedEvent(ev)}
              >
                {/* Poster Image */}
                {ev.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.imageUrl} alt={ev.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
                
                {/* Content over image */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                   {/* Top: Badges */}
                   <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-2">
                        <span className="backdrop-blur-md bg-black/40 text-white border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
                           {formatDate(ev.eventDate)}
                        </span>
                        <span className="backdrop-blur-md bg-boston-gold text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none self-start shadow-xl shadow-boston-gold/30">
                           {formatTime(ev.eventDate)}
                        </span>
                      </div>
                      {ev.benefits && (
                         <div className="bg-gradient-to-r from-boston-red to-boston-red-glow text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 rotate-3">
                            {ev.benefits}
                         </div>
                      )}
                   </div>

                   {/* Bottom: Title & Info */}
                   <div>
                      <p className="text-boston-gold font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                         <span className="w-4 h-[1px] bg-boston-gold" /> {ev.location}
                      </p>
                      <h4 className="text-white font-black text-4xl uppercase leading-[0.8] mb-4 group-hover:tracking-tight transition-all duration-500">
                         {ev.title.split(' ').map((word, i) => (
                           <span key={i} className="block">{word}</span>
                         ))}
                      </h4>
                      <p className="text-white/60 text-sm font-medium leading-tight line-clamp-2 italic mb-6">
                         "{ev.description}"
                      </p>
                      
                      <div className="flex gap-3">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleAction(ev); }}
                           className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                         >
                           {ev.buttonText || "Canjear"}
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                           className="w-14 h-14 bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center rounded-2xl hover:bg-white/20 transition-all text-white"
                         >
                           <Sparkles className="w-5 h-5" />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0a0a0a] rounded-t-[3rem] sm:rounded-[3rem] border-t sm:border border-white/10 overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
               {/* Modal Header/Image */}
               <div className="h-64 relative">
                  {selectedEvent.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-6 right-6 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10"
                  >
                     <ArrowLeft className="w-5 h-5 rotate-[-90deg]" />
                  </button>
               </div>

               {/* Modal Content */}
               <div className="p-8 space-y-6">
                  <div>
                    <span className="text-boston-gold font-black uppercase text-[10px] tracking-widest mb-2 block">{selectedEvent.location}</span>
                    <h3 className="text-white font-black text-4xl uppercase leading-none">{selectedEvent.title}</h3>
                    <div className="flex gap-4 mt-4">
                       <div className="flex flex-col">
                          <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Fecha</span>
                          <span className="text-xs text-white font-bold">{formatDate(selectedEvent.eventDate)}</span>
                       </div>
                       <div className="flex flex-col border-l border-white/10 pl-4">
                          <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Apertura</span>
                          <span className="text-xs text-white font-bold">{formatTime(selectedEvent.eventDate)}hs</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-white font-bold italic text-lg leading-tight">"{selectedEvent.description}"</p>
                     <div className="h-[1px] w-full bg-white/5" />
                     <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                        {selectedEvent.details || "Disfruta de una noche única en Boston Club. Beneficios exclusivos para socios VIP."}
                     </p>
                  </div>

                  {selectedEvent.benefits && (
                    <div className="bg-boston-gold/10 border border-boston-gold/20 p-5 rounded-3xl">
                       <p className="text-boston-gold font-black text-[10px] uppercase tracking-widest mb-1">Beneficio de Membresía</p>
                       <p className="text-white font-bold text-sm">{selectedEvent.benefits}</p>
                    </div>
                  )}

                  <button 
                    onClick={() => handleAction(selectedEvent)}
                    className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {selectedEvent.buttonText || "Realizar Reserva"}
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
