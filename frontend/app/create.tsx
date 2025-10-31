import React from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import BottomNav from '../components/BottomNav';

export default function CreateRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Criar</Text>
        <Text style={{ marginTop: 12, color: '#6b7280' }}>
          Composer completo (em breve)
        </Text>
      </View>
      <BottomNav active="story" />
    </SafeAreaView>
  );
}
