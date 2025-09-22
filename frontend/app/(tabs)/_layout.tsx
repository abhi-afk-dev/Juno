import { Tabs, useRouter } from 'expo-router'; // 1. Import useRouter
import React from 'react';
import { StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import FloatingMenu from '../../components/floatingMenu';
import { ThemeProvider, useTheme } from '../../components/themeProvider';

function RootLayoutContent() {
  const { theme } = useTheme();
  const router = useRouter(); // 2. Get the router instance

  const handleNewChat = () => {
    router.push('/home');
  };

  return (
    <>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      <Tabs
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="cal" />
      </Tabs>
      {/* 4. Pass the function to the FloatingMenu component */}
      <FloatingMenu onNewChat={handleNewChat} />
    </>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}