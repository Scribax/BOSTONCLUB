import { AppTheme } from '../../themes';

export interface VipStatusProps {
  isVisible: boolean;
  onClose: () => void;
  user: any;
  settings: any;
  benefits: any[];
  loading: boolean;
  redeemingId: string | null;
  handleRedeem: (benefit: any) => Promise<void>;
  fetchBenefits: () => Promise<void>;
  theme: AppTheme;
  nextTier?: { name: string; pointsNeeded: number };
}
