import { Tabs } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import FloatingMenu from '../../components/floatingMenu';
import { ThemeProvider, useTheme } from '../../components/themeProvider';

function RootLayoutContent() {
  const { theme } = useTheme();

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
        {/* <Tabs.Screen name="voice" /> */}
        <Tabs.Screen name="history" />
        <Tabs.Screen name="cal" />
      </Tabs>
      <FloatingMenu />
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