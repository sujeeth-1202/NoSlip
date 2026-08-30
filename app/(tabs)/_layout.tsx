import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={'/login' as any} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
