import { AppTheme } from '../../themes';

export interface LoginProps {
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  dni: string;
  setDni: (dni: string) => void;
  whatsapp: string;
  setWhatsapp: (wa: string) => void;
  birthDateInput: string;
  setBirthDateInput: (date: string) => void;
  referralCode: string;
  setReferralCode: (code: string) => void;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  videoUrl: string | null;
  theme: AppTheme;
  handleAuth: () => Promise<void>;
  resolveVideoUrl: (url: string | null) => string | null;
}
