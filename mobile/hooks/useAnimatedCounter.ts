import { useEffect, useRef, useState } from 'react';

export function useAnimatedCounter(target: number, duration = 800): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;

    if (from === target) return;

    const steps = 30;
    const stepTime = duration / steps;
    const diff = target - from;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setCurrent(Math.round(from + diff * ease));
      if (step >= steps) {
        setCurrent(target);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return current;
}
