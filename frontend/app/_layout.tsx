import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { initializeSocket } from '../utils/websocket';
import { getToken } from '../utils/api';
import '../global.css';
import { UnreadProvider } from '../contexts/UnreadContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import NotificationToast from '../components/NotificationToast';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Initialize WebSocket connection when user is logged in
    const token = getToken();
    if (token) {
      initializeSocket();
    }
  }, []);

  return (
    <UnreadProvider>
      <NotificationProvider>
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="feed" />
            <Stack.Screen name="messages" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="visits" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="profile/[id]" />
            <Stack.Screen name="profile/about" />
            <Stack.Screen name="story" />
            <Stack.Screen name="story/[id]" />
            <Stack.Screen name="story/create" />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="photo/[id]" />
            <Stack.Screen name="video/[id]" />
            <Stack.Screen name="cover/[id]" />
            <Stack.Screen name="create" />
            <Stack.Screen name="search" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <NotificationToast />
          <StatusBar style="light" />
        </>
      </NotificationProvider>
    </UnreadProvider>
  );
}
