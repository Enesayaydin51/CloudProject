import React from 'react';
import { Pressable } from 'react-native';
import { playClickSound } from '../utils/clickSound';

/**
 * Basıldığında tıklama sesi + haptic çalan Pressable.
 * Tüm Pressable proplarını kabul eder.
 */
export default function PressableWithSound({ onPress, children, ...rest }) {
  const handlePress = (ev) => {
    playClickSound();
    onPress?.(ev);
  };
  return (
    <Pressable onPress={handlePress} {...rest}>
      {children}
    </Pressable>
  );
}
