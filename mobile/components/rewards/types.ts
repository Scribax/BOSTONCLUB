import { AppTheme } from '../../themes';

export type Reward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: string;
  imageUrl?: string;
};

export interface RewardsProps {
  userPoints: number | null;
  rewards: Reward[];
  loading: boolean;
  theme: AppTheme;
}
