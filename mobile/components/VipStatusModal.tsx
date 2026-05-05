import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import VipStatusDefault from './vip/VipStatusDefault';
import VipStatusHalloween from './vip/VipStatusHalloween';

interface VipStatusModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: any;
  settings: any;
  onRedeemSuccess?: (token: string, rewardName: string) => void;
}

export const VipStatusModal = ({ isVisible, onClose, user, settings, onRedeemSuccess }: VipStatusModalProps) => {
  const { theme } = useTheme();
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      fetchBenefits();
    }
  }, [isVisible]);

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vip-benefits/me');
      setBenefits(res.data);
    } catch (err) {
      console.error('Error fetching benefits in modal', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (benefit: any) => {
    if (benefit.isLocked) return;
    setRedeemingId(benefit.id);
    try {
      const res = await api.post('/redemptions/generate', { vipBenefitId: benefit.id });
      onClose();
      if (onRedeemSuccess) {
        onRedeemSuccess(res.data.qrToken, benefit.title);
      }
    } catch (err: any) {
      console.error('Redeem error', err);
    } finally {
      setRedeemingId(null);
    }
  };

  const calculateNextTier = () => {
    if (!user || !settings) return undefined;
    const pts = user.points;
    let nextTierName = "";
    let nextTierPts = 0;

    if (pts < settings.goldThreshold) {
      nextTierName = "ORO"; nextTierPts = settings.goldThreshold;
    } else if (pts < settings.platinumThreshold) {
      nextTierName = "PLATINO"; nextTierPts = settings.platinumThreshold;
    } else if (pts < settings.diamondThreshold) {
      nextTierName = "DIAMANTE"; nextTierPts = settings.diamondThreshold;
    } else if (pts < settings.superVipThreshold) {
      nextTierName = "SÚPER VIP"; nextTierPts = settings.superVipThreshold;
    } else {
      return undefined;
    }
    return { name: nextTierName, pointsNeeded: nextTierPts };
  };

  const nextTier = calculateNextTier();

  const props = {
    isVisible, onClose, user, settings, benefits, loading, redeemingId, handleRedeem, fetchBenefits, theme, nextTier
  };

  if (theme.name === 'halloween') {
    return <VipStatusHalloween {...props} />;
  }

  return <VipStatusDefault {...props} />;
};
