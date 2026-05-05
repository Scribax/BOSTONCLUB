import { useState, useEffect } from 'react';
import api from '../lib/api';

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const response = await api.get('/flags/public');
      setFlags(response.data);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (flagName: string) => {
    return flags[flagName] === true;
  };

  return { flags, loading, isEnabled, refreshFlags: fetchFlags };
}
