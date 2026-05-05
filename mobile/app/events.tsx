import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import EventsDefault from '../components/events/EventsDefault';
import EventsHalloween from '../components/events/EventsHalloween';
import { EventData } from '../components/events/types';

export default function EventsScreen() {
  const { theme } = useTheme();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      // Filtrar solo eventos activos
      const fetched = data.filter((e: any) => (e.type === 'EVENT' || e.type === 'EVENTO') && e.isActive !== false);
      setEvents(fetched);
    } catch (err) {
      console.error(err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        await fetchEvents();
        if (isMounted) setLoading(false);
      })();
      const iv = setInterval(fetchEvents, 60000);
      return () => {
        isMounted = false;
        clearInterval(iv);
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const props = {
    events,
    loading,
    refreshing,
    onRefresh,
    theme
  };

  if (theme.name === 'halloween') {
    return <EventsHalloween {...props} />;
  }

  return <EventsDefault {...props} />;
}
