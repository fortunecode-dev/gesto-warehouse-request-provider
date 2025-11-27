import { useAppTheme } from "@/providers/ThemeProvider";
import { getActiveRequests } from "@/services/pedidos.service";
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "react-native-paper";

interface ActiveRequest {
  id: string;
  areaName: string;
  areaId: string;
  employeeName: string;
  productCount: number;
  createdAt: string;
  hasRequests?: boolean;
}

export default function ActiveRequestsScreen() {
  const [activeRequests, setActiveRequests] = useState<ActiveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const themeColors = {
    bg: dark ? "#0d1117" : "#f5f7fa",
    cardBorder: dark ? "#30363d" : "#e5e7eb",
    textSecondary: dark ? "#9da5b4" : "#555555",
    badgeBg: dark ? "#1f3827" : "#d4f5e3",
    badgeText: dark ? "#6be29c" : "#2ecc71",
    activeBg: dark ? "#1f3827" : "#eafaf1",
    activeBorder: dark ? "#3ddc84" : "#2ecc71",
    shadowColor: dark ? "#000" : "#000",
    background: dark ? "#111827" : "#f2f2f2",
    card: dark ? "#1f2937" : "#ffffff",
    text: dark ? "#f9fafb" : "#2c3e50",
    border: dark ? "#374151" : "#e0e0e0",
    inputBg: dark ? "#1f2937" : "#fafafa",
    inputText: dark ? "#f3f4f6" : "#2c3e50",
    primary: dark ? "#60A5FA" : "#3498db",
    success: "#2ecc71",
    danger: "#e74c3c",
    markBgLight: "#e0f2fe",
    markBgDark: "#0b3b57",
  };

  const loadActiveRequests = async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      const requests = await getActiveRequests();
      setActiveRequests(requests);
    } catch (error) {
      console.error("Error loading active requests:", error);
    } finally {
      isRefreshing ? setRefreshing(false) : setLoading(false);
    }
  };

  const handleSelectRequest = async (area: ActiveRequest) => {
    try {
      await AsyncStorage.setItem('selectedLocal', area.id);
      await AsyncStorage.setItem('selectedLocalName', area.areaName);
      router.push({ pathname: "/checkout" })
    } catch (error) {
      console.error("Error selecting request:", error);
    }
  };

  useFocusEffect(useCallback(() => { loadActiveRequests(); }, []));

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <Text style={[styles.headerTitle, { color: themeColors.primary }]}>
        Pedidos Activos
      </Text>

      <FlatList
        data={activeRequests}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => loadActiveRequests(true)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              No hay pedidos activos
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = !!item.hasRequests;

          return (
            <TouchableOpacity
              onPress={() => handleSelectRequest(item)}
              activeOpacity={0.75}
              style={[
                styles.card,
                {
                  backgroundColor: isActive ? themeColors.activeBg : themeColors.card,
                  borderColor: isActive ? themeColors.activeBorder : themeColors.cardBorder,
                  shadowColor: themeColors.shadowColor,
                },
                isActive && { borderWidth: 2 },
              ]}
            >
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                  {item.areaName}
                </Text>
              </View>

              <View style={styles.arrowRight}>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={26}
                  color={themeColors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}


/* ===================== ESTILOS BASE ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 35,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 18,
    textAlign: "center",
  },

  listContent: {
    paddingBottom: 40,
  },

  card: {
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    flexShrink: 1,
  },

  arrowRight: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },

  badgeText: {
    fontWeight: "700",
    fontSize: 12,
  },

  emptyContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 15,
  },
});
