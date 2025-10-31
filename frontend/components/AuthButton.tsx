import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type AuthButtonProps = {
  title: string;
  onPress?: () => void;
};

export default function AuthButton({ title, onPress }: AuthButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width: '100%' }}>
      <LinearGradient
        colors={["#0856d6", "#0b48b7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
