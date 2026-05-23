import { useEffect, useRef, useState } from 'react';

export function useAnimatedCounter(target: number): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    prevRef.current = target;

    const steps = 20;
    const duration = 500;
    const stepTime = duration / steps;
    const diff = target - from;
    let step = 0;

    const tick = () => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 4);
      setCurrent(Math.round(from + diff * ease));
      if (step < steps) {
        timerRef.current = setTimeout(tick, stepTime);
      }
    };

    timerRef.current = setTimeout(tick, stepTime);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [target]);

  return current;
}
