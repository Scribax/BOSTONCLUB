import { AppTheme } from '../../themes';

export interface RewardQRProps {
  token: string;
  reward: string;
  isCompleted: boolean;
  timeLeft: number;
  totpTimestamp: number;
  cancelling: boolean;
  handleCancel: () => Promise<void>;
  theme: AppTheme;
  fadeAnim: any;
}
