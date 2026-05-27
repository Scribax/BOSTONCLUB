import React, { useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import RewardsDefault from '../../components/rewards/RewardsDefault';
import RewardsHalloween from '../../components/rewards/RewardsHalloween';
import RewardsArgentina from '../../components/rewards/RewardsArgentina';
import { Reward } from '../../components/rewards/types';

export default function RewardsScreen() {
  const { theme } = useTheme();
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);
  const REFETCH_COOLDOWN = 60_000;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadData = async () => {
        const now = Date.now();
        if (rewards.length > 0 && now - lastFetchRef.current < REFETCH_COOLDOWN) {
          setLoading(false);
          return;
        }

        try {
          const [userData, rewardsData] = await Promise.all([
            api.get("/auth/me"),
            api.get("/rewards")
          ]);
          if (isMounted) {
            setUserPoints(userData.data.points);
            setRewards(rewardsData.data);
            lastFetchRef.current = Date.now();
          }
        } catch (err) {
          console.error("Error loading rewards data", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      loadData();
      
      return () => {
        isMounted = false;
      };
    }, [rewards.length])
  );

  const props = {
    userPoints,
    rewards,
    loading,
    theme
  };

  if (theme.name === 'halloween') return <RewardsHalloween {...props} />;
  if (theme.name === 'argentina') return <RewardsArgentina {...props} />;

  return <RewardsDefault {...props} />;
}
