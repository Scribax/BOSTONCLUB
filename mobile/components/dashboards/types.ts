export interface DashboardProps {
  user: any;
  banners: any[];
  promoBanners: any[];
  activeRedemption: any;
  settings: any;
  nextTier: any;
  isBirthday?: boolean;
  loading: boolean;
  setLoading: (val: boolean) => void;
  refreshing: boolean;
  errorStatus: 'connection' | 'session' | null;
  onRefresh: () => void;
  loadProfile: () => void;
  theme: any;
  router: any;
  isScreenFocused: boolean;
  currentPopup: any;
  showPopupModal: boolean;
  setShowPopupModal: (val: boolean) => void;
  resolveImageUrl: (url: string | undefined | null) => string | null;
  // Dashboard-specific UI state
  showGuide: boolean;
  setShowGuide: (val: boolean) => void;
  showBenefits: boolean;
  setShowBenefits: (val: boolean) => void;
  fetchVipBenefits: () => void;
  vipBenefits: any[];
  vipBenefitsLoading: boolean;
  redeemingVipId: string | null;
  handleRedeemVipBenefit: (token: string, reward: string) => void;
}
