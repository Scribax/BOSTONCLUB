import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { QrCode } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

interface DigitalCardProps {
  name: string;
  points: number;
  level: string;
  qrValue: string;
  nextTier?: { name: string; pointsNeeded: number; currentProgress: number };
  onPress?: () => void;
}

export default function DigitalCard({ name, points, level, qrValue, nextTier, onPress }: DigitalCardProps) {
  // Color logic equivalent to Web
  const getTierColors = () => {
    switch (level) {
      case "ORO": return "bg-[#b38728]";
      case "PLATINO": return "bg-[#E5E4E2]";
      case "DIAMANTE": return "bg-cyan-400";
      case "SÚPER VIP": return "bg-boston-red";
      default: return "bg-[#333]"; // BRONCE
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

  const getGradientPlaceholderColors = () => {
    switch (level) {
      case "ORO": return ['#BF953F', '#FCF6BA', '#B38728'];
      case "PLATINO": return ['#E5E4E2', '#F8F8F8', '#B4B4B4'];
      case "DIAMANTE": return ['#B9F2FF', '#E0FBFF', '#A0E9FF'];
      case "SÚPER VIP": return ['#FF3B30', '#ff4d4d', '#5a0000'];
      default: return ['#111', '#222', '#000'];
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper 
      activeOpacity={0.9}
      className={`w-full relative shadow-2xl rounded-[24px] overflow-hidden aspect-[1.58] bg-[#111] border border-white/5 ${onPress ? 'mb-0' : ''}`}
      onPress={onPress}
    >
      {/* Background Aura */}
      <View 
        className={`absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10 blur-3xl ${getTierColors()}`}
      />

      <View className="absolute inset-0 p-6 flex-col justify-between">
        {/* Top Header */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-3">
            <Text className="text-white/20 font-bold text-[8px] uppercase tracking-[0.4em] mb-1">Boston Club Card</Text>
            <Text className="text-white font-medium text-xl uppercase tracking-wider italic" numberOfLines={1}>
              {name}
            </Text>
          </View>
          <View className={`px-4 py-1.5 rounded-full ${getTierColors()} shadow-lg flex-shrink-0`}>
            <Text className={`text-[9px] font-black uppercase tracking-widest ${level === 'PLATINO' || level === 'DIAMANTE' ? 'text-black' : 'text-white'}`}>
              {level}
            </Text>
          </View>
        </View>

        {/* Middle: Points */}
        <View className="flex-col justify-center mt-3">
            <View className="flex-row items-baseline mb-1">
              <Text className="text-[2.5rem] leading-none font-light text-white tracking-tighter">
                {points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </Text>
              <Text className={`text-[9px] font-black uppercase tracking-[0.2em] ${getTierText()} opacity-80 italic ml-2`}>
                Puntos
              </Text>
            </View>
            
            {nextTier && (
              <View className="w-full mt-2">
                 <View className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                    <View 
                      className={`h-full ${getTierColors()}`}
                      style={{ width: `${nextTier.currentProgress}%` }}
                    />
                 </View>
                 <View className="flex-row justify-between mt-1.5">
                    <Text className="text-[7px] text-white/20 font-black uppercase tracking-widest">{level}</Text>
                    <Text className="text-[7px] text-white/20 font-black uppercase tracking-widest italic">Próximo: {nextTier.name}</Text>
                 </View>
              </View>
            )}
        </View>

        {/* Footer */}
        <View className="flex-row justify-between items-end pt-4 border-t border-white/5 mt-auto">
          <View className="flex-row items-center gap-3">
             <View className={`p-1.5 rounded-lg shadow-lg ${getTierColors()}`}>
                <QrCode size={20} color={level === 'PLATINO' || level === 'DIAMANTE' ? 'black' : 'white'} />
             </View>
             <View>
               <Text className="text-[9px] text-white/40 tracking-widest font-bold uppercase leading-none">ID</Text>
               <Text className="text-[8px] text-white/20 mt-1">BC-{qrValue.slice(-8).toUpperCase()}</Text>
             </View>
          </View>
          <View className="items-end">
             <Text className="text-white/40 font-black italic text-lg tracking-widest leading-none">BOSTON</Text>
             <Text className="text-white/30 font-bold text-[7px] uppercase tracking-[0.3em] mt-1">Official Member</Text>
          </View>
        </View>
      </View>
    </CardWrapper>
  );
}
