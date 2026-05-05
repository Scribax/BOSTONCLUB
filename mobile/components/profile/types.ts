import { AppTheme } from '../../themes';

export interface ProfileProps {
  user: any;
  setUser: (user: any) => void;
  settings: any;
  customAvatars: any[];
  isBiometricSupported: boolean;
  biometricsEnabled: boolean;
  setBiometricsEnabled: (enabled: boolean) => void;
  theme: AppTheme;
  isEnabled: (flag: string) => boolean;
}
