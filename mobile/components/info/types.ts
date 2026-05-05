import { AppTheme } from '../../themes';

export interface ClubInfoProps {
  user: any;
  settings: any;
  loading: boolean;
  theme: AppTheme;
  isEnabled: (feature: string) => boolean;
  pointsRate: number;
  referralPoints: number;
  streak: number;
  multiplier: string;
  progressWidth: string;
}
