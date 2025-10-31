import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getToken } from '../utils/api';
import Login from '../screens/Auth/Login';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        router.replace('/feed');
      }
    };

    checkAuth();
  }, [router]);

  return <Login />;
}
