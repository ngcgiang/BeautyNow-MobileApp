import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { isAuthenticated, getUserType } from './services/authService';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Set initial route to auth flow
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // State to track authentication status and user type
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean | null;
    userType: 'user' | 'salon' | null;
  }>({
    isAuthenticated: null,
    userType: null
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // Check authentication status
      const checkAuth = async () => {
        const authenticated = await isAuthenticated();
        const userType = authenticated ? await getUserType() : null;
        
        setAuthState({
          isAuthenticated: authenticated,
          userType: userType
        });
      };
      
      checkAuth();
    }
  }, [loaded]);

  if (!loaded || authState.isAuthenticated === null) {
    return null;
  }

  // Create a new object with isAuthenticated as boolean (no longer null at this point)
  const safeAuthState = {
    isAuthenticated: Boolean(authState.isAuthenticated),
    userType: authState.userType
  };

  return <RootLayoutNav authState={safeAuthState} />;
}

function RootLayoutNav({ authState }: { authState: { isAuthenticated: boolean; userType: 'user' | 'salon' | null } }) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(consumerTabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(salonTabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
      </Stack>

      {/* Redirect based on authentication state */}
      {authState.isAuthenticated ? (
        authState.userType === 'user' ? (
          <Redirect href="/(user)/index" />
        ) : authState.userType === 'salon' ? (
          <Redirect href="/salonTabs" />
        ) : (
          <Redirect href="/(auth)/login" />
        )
      ) : (
        <Redirect href="/(auth)/login" />
      )}
    </ThemeProvider>
  );
}
