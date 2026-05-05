import { AppTheme } from '../../themes';

export type HistoryEvent = {
  id: string;
  pointsGained: number;
  source: string;
  description: string | null;
  createdAt: string;
};

export interface HistoryProps {
  history: HistoryEvent[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  months: string[];
  filteredHistory: HistoryEvent[];
  stats: { total: number; bestMonth: string; maxPoints: number };
  theme: AppTheme;
}
