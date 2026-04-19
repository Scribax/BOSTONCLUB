import { QrCode } from "lucide-react";

interface DigitalCardProps {
  name: string;
  points: number;
  level: string;
  qrValue: string;
  nextTier?: { name: string; pointsNeeded: number; currentProgress: number };
  onClick?: () => void;
}

export default function DigitalCard({ name, points, level, qrValue, nextTier, onClick }: DigitalCardProps) {
  // Dynamic colors based on level
  const getTierColors = () => {
    switch (level) {
      case "ORO": return "from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-white";
      case "PLATINO": return "from-[#E5E4E2] via-[#F8F8F8] to-[#B4B4B4] text-black";
      case "DIAMANTE": return "from-[#B9F2FF] via-[#E0FBFF] to-[#A0E9FF] text-black";
      case "SÚPER VIP": return "from-boston-red via-[#ff4d4d] to-[#5a0000] text-white";
      default: return "from-[#111] via-[#222] to-black text-white";
    }
  };

  const getTierBadge = () => {
    switch (level) {
      case "ORO": return "bg-black/20 text-white border-white/40 backdrop-blur-md shadow-[0_0_10px_rgba(255,255,255,0.2)]";
      case "PLATINO": return "bg-white/20 text-white border-white/30";
      case "DIAMANTE": return "bg-cyan-400/20 text-cyan-400 border-cyan-400/30 font-black";
      case "SÚPER VIP": return "bg-white/20 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse";
      default: return "bg-white/5 text-white/50 border-white/10";
    }
  };  // Color accents based on tier (Only for badge and QR)
  const getTierAccent = () => {
    switch (level) {
      case "ORO": return "from-boston-gold via-yellow-200 to-boston-gold";
      case "PLATINO": return "from-slate-200 via-white to-slate-400";
      case "DIAMANTE": return "from-cyan-400 via-cyan-100 to-cyan-500";
      case "SÚPER VIP": return "from-boston-red via-red-300 to-boston-red-glow";
      default: return "from-boston-red via-red-400 to-boston-red"; // BRONCE
    }
  };

  const getTierText = () => {
    switch (level) {
      case "ORO": return "text-boston-gold";
      case "PLATINO": return "text-white";
      case "DIAMANTE": return "text-cyan-400";
      case "SÚPER VIP": return "text-boston-red-glow";
      default: return "text-white/60";
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`w-full relative shadow-2xl rounded-[24px] overflow-hidden aspect-[1.58] group transition-all duration-300 ${onClick ? "cursor-pointer active:scale-95" : ""} will-change-transform bg-[#111] border border-white/5`}
    >
      {/* Sophisticated Matte Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      
      {/* Very subtle top light */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

      {/* Card Content */}
      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-10">
        
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <h3 className="text-white/20 font-bold text-[7px] uppercase tracking-[0.4em] mb-1">Boston Club Card</h3>
            <p className="text-white font-medium text-lg sm:text-xl uppercase tracking-wider italic truncate">
               {name}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-gradient-to-r ${getTierAccent()} text-black shadow-lg`}>
            {level}
          </div>
        </div>

        {/* Middle: Points (Optimized for space) */}
        <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-2">
              <p className="text-4xl sm:text-5xl font-light text-white tracking-tighter">
                {points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </p>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${getTierText()} opacity-80 italic`}>Puntos</span>
            </div>
            
            {nextTier && (
              <div className="w-full mt-3 space-y-1.5">
                 <div className="h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getTierAccent()} transition-all duration-1000`}
                      style={{ width: `${nextTier.currentProgress}%` }}
                    />
                 </div>
                 <div className="flex justify-between text-[6px] text-white/20 font-black uppercase tracking-widest">
                    <span>{level}</span>
                    <span className="italic">Próximo: {nextTier.name}</span>
                 </div>
              </div>
            )}
        </div>

        {/* Footer: Clean & Integrated */}
        <div className="flex justify-between items-end pt-3 border-t border-white/5">
          <div className="flex items-center gap-3">
             <div className={`p-1 bg-gradient-to-br ${getTierAccent()} rounded-lg shadow-lg`}>
                <QrCode className="w-7 h-7 text-black" />
             </div>
             <div className="hidden sm:block">
               <p className="text-[8px] text-white/40 font-mono tracking-widest font-bold uppercase leading-none">ID</p>
               <p className="text-[7px] text-white/20 font-mono">BC-{qrValue.slice(-8).toUpperCase()}</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-white/20 font-black italic text-base sm:text-lg tracking-widest leading-none">BOSTON</p>
             <p className="text-white/10 font-bold text-[6px] uppercase tracking-[0.3em]">Official Member</p>
          </div>
        </div>

      </div>
    </div>
  );
}
