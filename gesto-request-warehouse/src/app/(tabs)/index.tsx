import { useAppTheme } from "@/providers/ThemeProvider";
import { getActiveRequests } from "@/services/pedidos.service";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    card: dark ? "#1f2937" : "#ffffff",
    border: dark ? "#374151" : "#e0e0e0",
    text: dark ? "#f9fafb" : "#2c3e50",
    secondaryText: dark ? "#9da5b4" : "#6b7280",
    primary: dark ? "#60A5FA" : "#3498db",
    buttonBg: dark ? "#1e40af" : "#e8f1ff",
    buttonText: dark ? "#bfdbfe" : "#1e3a8a",
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

  const handleSelect = async (area: ActiveRequest) => {
    await AsyncStorage.setItem("selectedLocal", area.id);
    await AsyncStorage.setItem("selectedLocalName", area.areaName);
    router.push("/checkout");
  };
  const handleSelectMovements = async (area: ActiveRequest) => {
    await AsyncStorage.setItem("selectedLocal", area.id);
    await AsyncStorage.setItem("selectedLocalName", area.areaName);
    router.navigate(`/history?areaId=${area.id}`);
  };
  const handleSelectAssigns = async (area: ActiveRequest) => {
    await AsyncStorage.setItem("selectedLocal", area.id);
    await AsyncStorage.setItem("selectedLocalName", area.areaName);
    router.push("/asignar");
  };

  const goTo = (route: "/asignar" | "/(tabs)/checkout" | "/(tabs)/history", areaId: string) => {
    router.push({ pathname: route, params: { areaId } });
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
        Áreas
      </Text>

      <FlatList
        data={activeRequests}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => loadActiveRequests(true)}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.secondaryText }]}>
              No hay áreas registradas
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const parts = item.areaName.split("-");
          const sub = parts[0]?.trim();
          const title = parts[1]?.trim() || parts[0];

          return (
            <View style={styles.card}>

              <View style={styles.rowCompact}>

                {/* HEADER IZQUIERDA */}
                <View style={styles.headerColumn}>
                  {parts[1] && (
                    <Text style={[styles.areaSub, { color: themeColors.secondaryText }]}>
                      {sub}
                    </Text>
                  )}
                  <Text style={[styles.areaTitle, { color: themeColors.text }]}>
                    {title}
                  </Text>
                </View>

                {/* COLUMNA DE MOVIMIENTOS / ASIGNADOS */}
                <View style={styles.middleColumn}>

                  <TouchableOpacity
                    style={[
                      styles.smallBtn,
                      { backgroundColor: dark ? "#1e3a8a" : "#dbeafe" },
                    ]}
                    onPress={() => handleSelectMovements(item)}
                  >
                    <MaterialIcons name="sync" size={18} color={dark ? "#93c5fd" : "#1e40af"} />
                    <Text style={[styles.smallBtnText, { color: dark ? "#bfdbfe" : "#1e3a8a" }]}>
                      Movimientos
                    </Text>
                  </TouchableOpacity>

                  {/* Asignados – Verde */}
                  <TouchableOpacity
                    style={[
                      styles.smallBtn,
                      { backgroundColor: dark ? "#14532d" : "#dcfce7" },
                    ]}
                    onPress={() => handleSelectAssigns(item)}
                  >
                    <MaterialIcons name="inventory" size={18} color={dark ? "#86efac" : "#166534"} />
                    <Text style={[styles.smallBtnText, { color: dark ? "#bbf7d0" : "#166534" }]}>
                      Asignados
                    </Text>
                  </TouchableOpacity>

                </View>

                {/* BOTÓN GRANDE DAR SALIDA */}
                <TouchableOpacity
                  style={[styles.bigBtn, { backgroundColor: themeColors.primary }]}
                  onPress={() => handleSelect(item)}
                >
                  <MaterialIcons name="exit-to-app" size={26} color="#fff" />
                  <Text style={styles.bigBtnText}>Dar salida</Text>
                </TouchableOpacity>

              </View>
            </View>


          );
        }}
      />
    </View>
  );
}

/* ===================== ESTILOS ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 28,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 22,
    textAlign: "center",
  },

  areaHeader: {
    marginBottom: 16,
  },

  actionsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    justifyContent: "center",
    borderRadius: 10,
    marginHorizontal: 4,
  },

  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },

  emptyContainer: {
    paddingVertical: 50,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
  },
  card: {
    borderWidth: 1,
    borderColor: "#d9d9d970",
    borderRadius: 14,
    padding: 8,
    marginBottom: 8,
  },
  rowCompact: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  bigBtn: {
    width: 100,
    height: 82,                // <- altura exacta base para emparejar
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,            // separación táctil con la columna media
    gap: 6,
  },

  bigBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  headerColumn: {
    flex: 1,
    marginRight: 12,
    justifyContent: "center",
  },

  areaSub: {
    fontSize: 16,
    marginBottom: 2,
    fontWeight: "600",     // ← MUCHO MÁS FUERTE
  },

  areaTitle: {
    fontSize: 24,          // ← MÁS GRANDE
    fontWeight: "800",     // ← MUCHO MÁS FUERTE
    letterSpacing: 0.3,
  },
  middleColumn: {
    width: 125,
    justifyContent: "center",
  },

  smallBtn: {
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    justifyContent: "center",
  },

  smallBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },

});