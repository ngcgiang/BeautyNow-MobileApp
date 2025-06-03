import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'white' },
        }}
      >
        <Stack.Screen name="register" />
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}