import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, Animated, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Crown, Star, Flame, Ticket, ArrowRight, User as UserIcon, MapPin, CreditCard, Gift, QrCode, History, X, Calendar, TrendingUp, Zap } from 'lucide-react-native';
import api, { getAuthToken, logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Dimensions, LogBox, Alert } from 'react-native';
import { initNotifications, registerForPushNotificationsAsync } from '../../lib/notificationHelper';
import { VideoPlayer } from '../../components/VideoPlayer';
import { FadeInView } from '../../components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';
import { VipStatusModal } from '../../components/VipStatusModal';
import { useTheme } from '../../contexts/ThemeContext';
import DashboardDefault from '../../components/dashboards/DashboardDefault';
import DashboardHalloween from '../../components/dashboards/DashboardHalloween';
import DashboardArgentina from '../../components/dashboards/DashboardArgentina';

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
  '[Reanimated] Writing to `value` during component render'
]);

// Initialize notifications configuration (solo en nativo)
if (Platform.OS !== 'web') {
  initNotifications();
}

// FIX PERF #3: Leer Dimensions una sola vez a nivel módulo en lugar de en cada render
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// FIX PERF #4: Array estático fuera del componente → no se recrea en cada render
const PROGRESS_TEXTURE_BARS = [...Array(20)].map((_, i) => i);

let hasShownGlobalPopup = false;

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  points: number;
  membershipLevel: string;
  streak?: number;
  lastStreakDate?: string;
  referralCode?: string;
};

type BannerEvent = {
  id: string;
  title: string;
  description: string;
  benefits?: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType: 'IMAGE' | 'VIDEO';
};

// Componente helper para animaciones optimizadas removido de acá y movido a components/FadeInView.tsx

const StreakBadge = ({ streak }: { streak: number }) => {
  if (streak <= 0) return null;

  const multiplier = streak >= 7 ? 'x2.0' : (streak >= 3 ? 'x1.5' : '');

  return (
    <FadeInView
      className="flex-row items-center bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-full px-3 py-1 self-start mt-2"
    >
      <Flame size={12} color="#FF3B30" fill="#FF3B30" />
      <Text className="text-[#FF3B30] font-black text-[9px] uppercase tracking-tighter ml-1.5">
        Racha {streak} {streak === 1 ? 'visita' : 'visitas'} {multiplier ? `• ${multiplier}` : ''}
      </Text>
    </FadeInView>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, isEnabled } = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CAROUSEL_WIDTH = SCREEN_WIDTH - 48; // SCREEN_WIDTH minus px-6 (24px * 2)
  const [user, setUser] = useState<UserData | null>(null);
  const [banners, setBanners] = useState<BannerEvent[]>([]);
  const [promoBanners, setPromoBanners] = useState<BannerEvent[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [currentPromoIdx, setCurrentPromoIdx] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const [errorStatus, setErrorStatus] = useState<null | 'connection' | 'session'>(null);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [vipBenefits, setVipBenefits] = useState<any[]>([]);
  const [vipBenefitsLoading, setVipBenefitsLoading] = useState(false);
  const [redeemingVipId, setRedeemingVipId] = useState<string | null>(null);

  const [currentPopup, setCurrentPopup] = useState<BannerEvent | null>(null);
  const [showPopupModal, setShowPopupModal] = useState(false);

  // FIX: New Architecture requiere que estas referencias sean estables (no recreadas en cada render)
  const onViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentBannerIdx(viewableItems[0].index ?? 0);
    }
  });

  const onPromoViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentPromoIdx(viewableItems[0].index ?? 0);
    }
  });

  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
  const bannerListRef = useRef<FlatList>(null);
  const promoListRef = useRef<FlatList>(null);

  // Auto-scroll effect para Banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        const nextIdx = (currentBannerIdx + 1) % banners.length;
        bannerListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [banners, currentBannerIdx]);

  // Auto-scroll effect para Promos
  useEffect(() => {
    if (promoBanners.length > 1) {
      const interval = setInterval(() => {
        const nextIdx = (currentPromoIdx + 1) % promoBanners.length;
        promoListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [promoBanners, currentPromoIdx]);

  const loadProfile = async () => {
    try {
      setErrorStatus(null);
      const token = await getAuthToken();
      if (!token) {
        return;
      }
      const [userDataRes, eventsRes, settingsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/events').catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: null }))
      ]);

      setUser(userDataRes.data);
      setSettings(settingsRes.data);

      const allEvents = eventsRes.data || [];
      const topBanners = allEvents.filter((e: any) => e.type === "BANNER" && e.isActive !== false);
      const bottomPromos = allEvents.filter((e: any) => e.type === "PROMO" && e.isActive !== false);
      const splashPopups = allEvents.filter((e: any) => e.type === "POPUP" && e.isActive !== false);

      setBanners(topBanners);
      setPromoBanners(bottomPromos);

      if (splashPopups.length > 0 && !hasShownGlobalPopup) {
        setCurrentPopup(splashPopups[0]);
        setShowPopupModal(true);
        hasShownGlobalPopup = true;
      }

      return true;
    } catch (err: any) {
      console.error('Load Profile Error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorStatus('session');
        await logout();
      } else {
        setErrorStatus('connection');
      }
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchVipBenefits = async () => {
    setVipBenefitsLoading(true);
    try {
      const res = await api.get('/vip-benefits/me');
      setVipBenefits(res.data);
    } catch (err) {
      console.error('Error fetching VIP benefits', err);
    } finally {
      setVipBenefitsLoading(false);
    }
  };

  const handleRedeemVipBenefit = (token: string, reward: string) => {
    router.push({
      pathname: '/reward-qr',
      params: { token, reward }
    });
  };

  const resolveImageUrl = (url: string | undefined | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseUrl = api.defaults.baseURL || 'https://mybostonclub.com/api';
    const rootUrl = baseUrl.replace(/\/api$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${rootUrl}${cleanUrl}`;
  };

  const [activeRedemption, setActiveRedemption] = useState<any>(null);

  const fetchActiveRedemption = async () => {
    try {
      const res = await api.get('/redemptions/active');
      setActiveRedemption(res.data);
    } catch (err) {
      console.error('Error fetching active redemption', err);
    }
  };

  // FIX PERF #1: Cooldown de 30s para evitar re-fetches en cada foco de pantalla
  const lastFetchRef = useRef<number>(0);
  const REFETCH_COOLDOWN = 30_000;

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      const now = Date.now();
      const shouldRefetch = now - lastFetchRef.current > REFETCH_COOLDOWN;

      if (shouldRefetch) {
        lastFetchRef.current = now;
        const initDashboard = async () => {
          try {
            const success = await loadProfile();
            if (success) {
              registerForPushNotificationsAsync();
              fetchVipBenefits();
            }
          } catch (e) {
            console.error("Dashboard Init Error:", e);
          }
        };
        initDashboard();
      }

      // Siempre buscamos si hay un canje activo, sin importar el cooldown,
      // porque el usuario puede haber creado uno en otra pestaña recién.
      fetchActiveRedemption();

      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );



  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  // FIX PERF #2: Memoizar el cálculo del siguiente tier → solo recalcula si cambian puntos o settings
  const nextTier = useMemo(() => {
    if (!user || !settings) return undefined;
    const pts = user.points;
    let nextTierName = '';
    let nextTierPts = 0;
    let currentTierPts = 0;

    if (pts < settings.goldThreshold) {
      nextTierName = 'ORO'; nextTierPts = settings.goldThreshold; currentTierPts = 0;
    } else if (pts < settings.platinumThreshold) {
      nextTierName = 'PLATINO'; nextTierPts = settings.platinumThreshold; currentTierPts = settings.goldThreshold;
    } else if (pts < settings.diamondThreshold) {
      nextTierName = 'DIAMANTE'; nextTierPts = settings.diamondThreshold; currentTierPts = settings.platinumThreshold;
    } else if (pts < settings.superVipThreshold) {
      nextTierName = 'SÚPER VIP'; nextTierPts = settings.superVipThreshold; currentTierPts = settings.diamondThreshold;
    } else {
      return undefined;
    }

    const progress = Math.min(100, Math.max(0, ((pts - currentTierPts) / (nextTierPts - currentTierPts)) * 100));
    return { name: nextTierName, pointsNeeded: nextTierPts, currentProgress: progress };
  }, [user?.points, settings?.goldThreshold, settings?.platinumThreshold, settings?.diamondThreshold, settings?.superVipThreshold]);

  const dashboardProps = {
    user, banners, promoBanners, activeRedemption, settings, nextTier,
    loading, setLoading, errorStatus, refreshing, onRefresh, loadProfile,
    theme, router, isScreenFocused, currentPopup, showPopupModal, setShowPopupModal,
    resolveImageUrl, showGuide, setShowGuide, showBenefits, setShowBenefits,
    fetchVipBenefits, vipBenefits, vipBenefitsLoading, redeemingVipId, handleRedeemVipBenefit
  };

  if (theme.name === 'halloween') {
    return <DashboardHalloween {...dashboardProps} />;
  }

  if (theme.name === 'argentina') {
    return <DashboardArgentina {...dashboardProps} />;
  }

  return <DashboardDefault {...dashboardProps} />;
}
