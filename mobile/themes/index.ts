export interface AppTheme {
  name: string;
  // Primary — the "accent" color (red for Boston, orange for Halloween, etc.)
  primary: string;
  primaryDark: string;
  primaryDarker: string;
  primaryGlow: string; // For shadows / glows
  // Secondary — the "gold" equivalent
  secondary: string;
  secondaryDark: string;
  // Backgrounds
  background: string;    // Main app background
  surface: string;       // Cards, modals
  surfaceAlt: string;    // Slightly lighter cards
  surfaceDark: string;   // Darker inset areas
  // Text is always white-based so we keep it fixed
}

export const BostonTheme: AppTheme = {
  name: 'boston',
  primary: '#FF3B30',
  primaryDark: '#CC2D22',
  primaryDarker: '#991F19',
  primaryGlow: '#FF4D4D',
  secondary: '#D4AF37',
  secondaryDark: '#8A6D3B',
  background: '#050505',
  surface: '#0a0a0a',
  surfaceAlt: '#0c0c0c',
  surfaceDark: '#111111',
};

export const HalloweenTheme: AppTheme = {
  name: 'halloween',
  primary: '#FF6B00',
  primaryDark: '#CC5500',
  primaryDarker: '#993F00',
  primaryGlow: '#FF8C00',
  secondary: '#9333EA',
  secondaryDark: '#6B21A8',
  background: '#080305',
  surface: '#100810',
  surfaceAlt: '#120A12',
  surfaceDark: '#0A0508',
};

export const ArgentinaTheme: AppTheme = {
  name: 'argentina',
  primary: '#75AADB',
  primaryDark: '#4A87C2',
  primaryDarker: '#2E6BA8',
  primaryGlow: '#8FBBDF',
  secondary: '#FFFFFF',
  secondaryDark: '#C8D8E8',
  background: '#03080F',
  surface: '#060D18',
  surfaceAlt: '#080F1C',
  surfaceDark: '#050B14',
};

export const ChristmasTheme: AppTheme = {
  name: 'christmas',
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryDarker: '#15803D',
  primaryGlow: '#4ADE80',
  secondary: '#EF4444',
  secondaryDark: '#DC2626',
  background: '#030805',
  surface: '#060F08',
  surfaceAlt: '#07110A',
  surfaceDark: '#050C07',
};

/**
 * Selects the active theme based on feature flags.
 * Priority: Argentina > Halloween > Christmas > Boston (default)
 */
export function selectTheme(flags: Record<string, boolean>): AppTheme {
  if (flags['argentina_theme']) return ArgentinaTheme;
  if (flags['halloween_theme']) return HalloweenTheme;
  if (flags['christmas_theme']) return ChristmasTheme;
  return BostonTheme;
}
