import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Stepper({ steps, current }: { steps: number; current: number }) {
  const dots = [];
  for (let i = 0; i < steps; i++) {
    dots.push(
      <View key={i} style={[styles.dot, i === current ? styles.dotActive : null]} />
    );
  }
  return <View style={styles.row}>{dots}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e5e7eb', marginHorizontal: 6 },
  dotActive: { backgroundColor: '#0856d6' },
});
