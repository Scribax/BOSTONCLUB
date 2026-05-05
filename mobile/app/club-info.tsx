import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import ClubInfoDefault from '../components/info/ClubInfoDefault';
import ClubInfoHalloween from '../components/info/ClubInfoHalloween';

export default function ClubInfoScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isEnabled, theme } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, userRes] = await Promise.all([
        api.get('/settings'),
        api.get('/auth/me')
      ]);
      setSettings(settingsRes.data);
      setUser(userRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const pointsRate = settings?.pointsPerPeso ?? 1.0;
  const referralPoints = settings?.referralRewardReferrer ?? 500;
  const streak = user?.streak || 0;
  
  let multiplier = "1.0";
  let progressWidth = "10%";
  if (streak >= 7) { multiplier = "2.0"; progressWidth = "100%"; }
  else if (streak >= 3) { multiplier = "1.5"; progressWidth = "50%"; }
  else if (streak > 0) { multiplier = "1.0"; progressWidth = "20%"; }

  const props = {
    user, settings, loading, theme, isEnabled, pointsRate, referralPoints, streak, multiplier, progressWidth
  };

  if (theme.name === 'halloween') {
    return <ClubInfoHalloween {...props} />;
  }

  return <ClubInfoDefault {...props} />;
}