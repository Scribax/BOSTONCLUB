import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { AppTheme, BostonTheme, selectTheme } from '../themes';

interface ThemeContextValue {
  theme: AppTheme;
  flags: Record<string, boolean>;
  isEnabled: (flag: string) => boolean;
  refreshTheme: () => void;
  isHappyHour: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: BostonTheme,
  flags: {},
  isEnabled: () => false,
  refreshTheme: () => {},
  isHappyHour: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<AppTheme>(BostonTheme);

  const fetchFlags = useCallback(async () => {
    try {
      const response = await api.get('/flags/public');
      const data: Record<string, boolean> = response.data;
      setFlags(data);
      setTheme(selectTheme(data));
    } catch (error) {
      // Network error — keep current theme, don't crash
      console.warn('ThemeContext: Could not fetch flags, using current theme.');
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    // Refresh theme every 5 minutes so changes made in the admin
    // panel are eventually picked up without the user restarting the app.
    const interval = setInterval(fetchFlags, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (flag: string) => flags[flag] === true,
    [flags]
  );

  const isHappyHour = isEnabled('enable_happy_hour');

  return (
    <ThemeContext.Provider value={{ theme, flags, isEnabled, refreshTheme: fetchFlags, isHappyHour }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Primary hook — use this everywhere in the app */
export function useTheme() {
  return useContext(ThemeContext);
}
