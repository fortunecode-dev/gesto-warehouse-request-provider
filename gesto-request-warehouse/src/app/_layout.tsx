import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import 'react-native-reanimated';
import "../global.css";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 360;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB', // Azul elegante
        tabBarInactiveTintColor: '#94A3B8', // Gris sobrio
        tabBarLabelStyle: {
          fontSize: isSmallDevice ? 11 : 13,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 4 : 2,
        },
        tabBarItemStyle: {
          flexDirection: 'column',
          paddingVertical: 4,
        },
        tabBarStyle: {
          height: Platform.OS === 'android' ? 60 : 70,
          paddingBottom: Platform.OS === 'android' ? 6 : 10,
          paddingTop: 6,
          backgroundColor: '#F9FAFB',
          borderTopWidth: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
      }}
    >
      
      {/* WAREHOUSE */}
      <Tabs.Screen
        name="(tabs)/index"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={focused ? 22 : 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/checkout"
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
    </Tabs>
  );
}
