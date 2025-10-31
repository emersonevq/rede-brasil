import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import StoryEditor from '../../components/StoryEditor';

export default function CreateStoryScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <StoryEditor onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
});
