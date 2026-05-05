import { AppTheme } from '../../themes';

export type EventData = {
  id: string;
  title: string;
  description: string;
  details: string;
  location: string;
  eventDate: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: string;
  benefits: string;
  buttonText: string;
  externalLink: string;
  content?: string;
  secondaryImageUrl?: string;
  secondaryMediaType?: string;
  linkedEventId?: string;
};

export interface EventsProps {
  events: EventData[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  theme: AppTheme;
}
