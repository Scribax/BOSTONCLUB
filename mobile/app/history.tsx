import React, { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import HistoryDefault from '../components/history/HistoryDefault';
import HistoryHalloween from '../components/history/HistoryHalloween';
import HistoryArgentina from '../components/history/HistoryArgentina';
import { HistoryEvent } from '../components/history/types';

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const { theme } = useTheme();

  const fetchHistory = async () => {
    try {
      const response = await api.get('/points/history');
      setHistory(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    await fetchHistory();
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const months = useMemo(() => {
    const m = ['TODOS'];
    history.forEach(item => {
      const monthName = new Date(item.createdAt).toLocaleString('es-ES', { month: 'long' }).toUpperCase();
      if (!m.includes(monthName)) m.push(monthName);
    });
    return m;
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (selectedMonth === 'TODOS') return history;
    return history.filter(item => 
      new Date(item.createdAt).toLocaleString('es-ES', { month: 'long' }).toUpperCase() === selectedMonth
    );
  }, [history, selectedMonth]);

  const stats = useMemo(() => {
    const total = history.reduce((acc, curr) => acc + (curr.pointsGained > 0 ? curr.pointsGained : 0), 0);
    const monthTotals: { [key: string]: number } = {};
    history.forEach(item => {
      if (item.pointsGained > 0) {
        const m = new Date(item.createdAt).toLocaleString('es-ES', { month: 'long' }).toUpperCase();
        monthTotals[m] = (monthTotals[m] || 0) + item.pointsGained;
      }
    });
    let bestMonth = '-';
    let maxPoints = 0;
    Object.keys(monthTotals).forEach(m => {
      if (monthTotals[m] > maxPoints) {
        maxPoints = monthTotals[m];
        bestMonth = m;
      }
    });
    return { total, bestMonth, maxPoints };
  }, [history]);

  const props = {
    history, loading, refreshing, onRefresh, 
    selectedMonth, setSelectedMonth, months, 
    filteredHistory, stats, theme
  };

  if (theme.name === 'halloween') return <HistoryHalloween {...props} />;
  if (theme.name === 'argentina') return <HistoryArgentina {...props} />;

  return <HistoryDefault {...props} />;
}
