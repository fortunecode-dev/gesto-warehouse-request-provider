import { Slot } from 'expo-router';
import { ThemeProvider } from '@/providers/ThemeProvider'; // ajusta la ruta si es necesario
import { GestureHandlerRootView } from "react-native-gesture-handler";
export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
