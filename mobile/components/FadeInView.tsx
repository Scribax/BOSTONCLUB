import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
  delay?: number;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const FadeInView = ({ delay = 0, children, className = "", style = {} }: FadeInViewProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      })
    ]).start();
  }, [delay]);

  return (
    <Animated.View 
      className={className}
      style={{
        ...style,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
    >
      {children}
    </Animated.View>
  );
};
