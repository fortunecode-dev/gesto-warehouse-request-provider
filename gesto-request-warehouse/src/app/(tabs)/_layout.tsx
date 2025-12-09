import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import 'react-native-reanimated';
import "../../global.css";
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from '@/providers/ThemeProvider'; // ✅ Hook personalizado

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme(); // ✅ Obtiene el tema actual desde el provider
  const isDark = theme === 'dark';
  const isSmallDevice = width < 360;

  // Colores dinámicos por tema
  const activeColor = isDark ? '#60A5FA' : '#2563EB';
  const inactiveColor = isDark ? '#9CA3AF' : '#94A3B8';
  const backgroundColor = isDark ? '#1F2937' : '#F9FAFB';

  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: activeColor,
            tabBarInactiveTintColor: inactiveColor,
            tabBarLabelStyle: {
              fontSize: isSmallDevice ? 13 : 15,
              fontWeight: '700',
              marginBottom: Platform.OS === 'android' ? 4 : 2,
            },
            tabBarItemStyle: {
              flexDirection: 'column',
              paddingVertical: 6,
            },
            tabBarStyle: {
              height: Platform.OS === 'android' ? 70 : 80,
              paddingBottom: Platform.OS === 'android' ? 8 : 12,
              paddingTop: 8,
              backgroundColor,
              borderTopWidth: 0,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              elevation: 0,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: -2 },
            },
          }}
        >

          {/* WAREHOUSE */}
          <Tabs.Screen
            name="index"
            options={{
              title: 'Áreas',
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="warehouse"
                  size={focused ? 22 : 20}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="checkout"
            options={{
              title: 'Almacén',
              tabBarIcon: ({ color, focused }) => (
                <Feather
                  name="package"
                  size={focused ? 20 : 18}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            listeners={{
              tabPress: () => {
                router.replace("/history"); // limpia params
              }
            }}
            options={{
              title: 'Historial',
              tabBarIcon: ({ color, focused }) => (
                <Feather
                  name="clock"
                  size={focused ? 20 : 18}
                  color={color}
                />
              ),

            }}
          />
          <Tabs.Screen
            name="recibir"
            options={{
              title: 'Recibir',
              tabBarIcon: ({ color, focused }) => (
                <Feather
                  name="download"
                  size={focused ? 20 : 18}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="asignar"
            options={{
              title: 'Asignar',
              tabBarIcon: ({ color, focused }) => (
                <Feather
                  name="download"
                  size={focused ? 20 : 18}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="ajustes"
            options={{
              title: 'Ajustes',
              tabBarIcon: ({ color, focused }) => (
                <Feather
                  name="settings"
                  size={focused ? 28 : 26}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>
      </SafeAreaView>
    </ThemeProvider>

  );
}
