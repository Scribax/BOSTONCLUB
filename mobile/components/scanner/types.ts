import { AppTheme } from '../../themes';

export interface ScannerProps {
  permission: any;
  requestPermission: () => Promise<any>;
  status: "idle" | "loading" | "success" | "error" | "pos_waiting";
  message: string;
  scanned: boolean;
  handleBarcodeScanned: (event: { type: string; data: string }) => Promise<void>;
  resetScanner: () => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  theme: AppTheme;
}
