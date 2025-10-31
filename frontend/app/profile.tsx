import Profile from '../screens/Profile/Profile';
import React, { useEffect } from 'react';
import { getCurrentUser } from '../utils/api';
import { useRouter } from 'expo-router';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getCurrentUser();
        if (!mounted) return;
        const username =
          me?.username ||
          `${(me?.first_name || '') + (me?.last_name || '')}`
            .toLowerCase()
            .replace(/\s+/g, '');
        if (username) {
          router.replace(`/profile/${encodeURIComponent(username)}`);
        } else {
          // if no username, go back to root
          router.replace('/');
        }
      } catch (e) {
        // not logged in -> go to login
        router.replace('/');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
