// ===========================================================
//  Basket (Asignación de Productos a Área)
//  — Basado en CheckoutBasket pero usando switches —
// ===========================================================

import { useAppTheme } from "@/providers/ThemeProvider";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getAllProducts,
  getItemsByArea,
  actualizarProductosDelArea,
} from "@/services/pedidos.service";
import { API_URL } from "@/config";
import { SafeAreaView } from "react-native-safe-area-context";

// ===========================================================
//  COMPONENTE PRINCIPAL — Asignar Productos al Área
// ===========================================================
export function AssignProducts({
  title = "Productos",
  help,
}: {
  title?: string;
  help: any;
}) {
  const [productos, setProductos] = useState<any[]>([]);
  const [areaName, setAreaName] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const listRef = useRef<FlatList>(null);

  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const backgroundColor = isDark ? '#1F2937' : '#F9FAFB';
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [alertedOffline, setAlertedOffline] = useState(false);
  const [trying, setTrying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // IDs seleccionados (switch en ON)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🔄 Health check cada 5 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (alertedOffline) setTrying(true);
        const res = await fetch(`${await API_URL()}/health`, { method: "GET" });
        const ok = res.ok;

        if (!ok && !alertedOffline) {
          Alert.alert("Conexión perdida", "No hay conexión con el servidor.");
          setAlertedOffline(true);
        }

        if (ok && alertedOffline) {
          setAlertedOffline(false);
        }

        setServerOnline(ok);
      } catch (e) {
        if (!alertedOffline) {
          Alert.alert("Conexión perdida", "No hay conexión con el servidor.");
          setAlertedOffline(true);
        }
        setServerOnline(false);
      }
      setTrying(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [alertedOffline, serverOnline]);

  const themeColors = {
    background: isDark ? "#111827" : "#f2f2f2",
    card: isDark ? "#1f2937" : "#ffffff",
    text: isDark ? "#f9fafb" : "#2c3e50",
    border: isDark ? "#374151" : "#e0e0e0",
    inputBg: isDark ? "#1f2937" : "#fafafa",
    inputText: isDark ? "#f3f4f6" : "#2c3e50",
    primary: isDark ? "#60A5FA" : "#3498db",
    success: "#2ecc71",
    danger: "#e74c3c",
    markBgLight: "#e0f2fe",
    markBgDark: "#0b3b57",
  };

  // ===========================================================
  //  Cargar productos + área + asignados
  // ===========================================================
  const load = async () => {
    try {
      setLoading(true);
      const areaId = await AsyncStorage.getItem("selectedLocal");
      const areaName = await AsyncStorage.getItem("selectedLocalName");
      if (!areaId) return router.push("/");

      const [allProducts, itemsByArea] = await Promise.all([
        getAllProducts(),
        getItemsByArea(),
      ]);

      const initiallySelectedIds = (itemsByArea || []).map((p: any) =>
        String(p.id)
      );

      // Ordenar solo en la carga inicial: primero los ya asignados
      const sortedProducts = [...(allProducts || [])].sort((a, b) => {
        const aSel = initiallySelectedIds.includes(String(a.id));
        const bSel = initiallySelectedIds.includes(String(b.id));
        if (aSel === bSel) return 0;
        return aSel ? -1 : 1;
      });

      setProductos(sortedProducts);
      setSelectedIds(initiallySelectedIds);
      setAreaName(areaName || "");
    } catch (e) {
      Alert.alert("Error cargando", String(e));
    }
    finally {
      setLoading(false); // ← DESACTIVAMOS EL LOADER
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  // ===========================================================
  //  Buscar productos
  // ===========================================================
  const normalize = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const onSearchFocus = useCallback(() => {
    if (!query) return;
    setQuery("");
  }, [query]);

  const filteredProductos = useMemo(() => {
    const q = normalize(query);
    if (!q) return productos;
    return productos.filter((p) => normalize(p.name).includes(q));
  }, [query, productos]);

  // ===========================================================
  //  Estado servidor
  // ===========================================================
  const renderServerStatus = () => {
    return trying ? (
      <ActivityIndicator size={25} color={themeColors.primary} />
    ) : serverOnline ? (
      <MaterialIcons
        name="cloud-done"
        size={28}
        color={themeColors.success}
      />
    ) : (
      <MaterialIcons name="cloud-off" size={28} color={themeColors.danger} />
    );
  };

  // ===========================================================
  //  Toggle de selección (switch)
  // ===========================================================
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  // ===========================================================
  //  Acción principal — Asignar productos al área
  // ===========================================================


  const handleAsignar = useCallback(async () => {
    try {
      setSubmitting(true);
      await actualizarProductosDelArea(selectedIds);
      Alert.alert("Éxito", "Los productos fueron asignados correctamente.");
      router.push("/");
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setSubmitting(false);
    }
  }, [selectedIds]);

  const handleAsignarConfirm = useCallback(() => {
    handleAsignar()
    // if (!selectedIds.length) {
    //   Alert.alert("Sin productos", "Seleccione al menos un producto.");
    //   return;
    // }

    // Alert.alert(
    //   "Confirmar asignación",
    //   "¿Esta seguro que desea asignarle esos productos al area?",
    //   [
    //     { text: "Cancelar", style: "cancel" },
    //     {
    //       text: "Sí, asignar",
    //       style: "destructive",
    //       onPress: handleAsignar,
    //     },
    //   ]
    // );
  }, [handleAsignar]);
  // ===========================================================
  //  Render item
  // ===========================================================
  const renderItem = useCallback(
    ({ item }: any) => {
      const id = String(item.id);
      const isSelected = selectedIds.includes(id);

      let borderColor = themeColors.border;
      let backgroundColor = themeColors.card;

      // if (isSelected) {
      //   borderColor = themeColors.primary;
      //   backgroundColor = isDark
      //     ? themeColors.markBgDark
      //     : themeColors.markBgLight;
      // }

      const container = [
        styles.productoContainer,
        {
          borderColor,
          backgroundColor,
          borderWidth: isSelected ? 3 : 1,
        },
      ];

      return (
        <View style={container}>
          <View style={styles.row}>
            <View style={styles.infoLeft}>
              <Text style={[styles.nombre, { color: themeColors.text }]}>
                {item.name}
              </Text>
              {!!item.netContent && (
                <Text style={{ color: themeColors.text }}>
                  Contenido neto: {item.netContent} {item.netContentUnitLabel}
                </Text>
              )}
            </View>

            <Switch
              value={isSelected}
              onValueChange={() => toggleSelection(id)}
              trackColor={{
                false: themeColors.danger,
                true: themeColors.success,
              }}
              thumbColor={"#fff"}
            />

          </View>
        </View>
      );
    },
    [selectedIds, themeColors, isDark, toggleSelection]
  );
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: themeColors.background,
        }}
      >
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 12, color: themeColors.text }}>
          Cargando productos...
        </Text>
      </View>
    );
  }

  // ===========================================================
  //  UI
  // ===========================================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}> <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: themeColors.card }]}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.titleSmall, { color: themeColors.text }]}>
              {title} - {areaName}
            </Text>

            <View style={styles.topRight}>
              {renderServerStatus()}

              <TouchableOpacity
                onPress={() => setHelpVisible(true)}
                style={[
                  styles.actionButton,
                  { backgroundColor: themeColors.primary },
                ]}
              >
                <Text style={styles.actionText}>Ayuda</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buscador */}
          <View style={styles.headerBottomRow}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <MaterialIcons name="search" size={18} color="#888" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onFocus={onSearchFocus}
                placeholder="Buscar..."
                placeholderTextColor="#888"
                blurOnSubmit={false}
                style={[
                  styles.searchInput,
                  { color: themeColors.inputText },
                ]}
                returnKeyType="search"
                autoCorrect={false}
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <MaterialIcons name="close" size={18} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={load}
              style={[
                styles.actionButton,
                { backgroundColor: themeColors.primary },
              ]}
            >
              <Text style={styles.actionText}>Actualizar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!serverOnline || submitting}
              onPress={handleAsignarConfirm}
              style={[
                styles.actionButton,
                {
                  backgroundColor:
                    !serverOnline || submitting
                      ? "#cccccc55"
                      : themeColors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                },
              ]}
            >
              {submitting && (
                <ActivityIndicator size={16} color="#ffffff" />
              )}
              <Text style={styles.actionText}>Asignar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LISTA */}
        <FlatList
          ref={listRef}
          data={filteredProductos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 10 }}
          keyboardShouldPersistTaps="always"
        />
      </View>
    </KeyboardAvoidingView>

      {/* MODAL AYUDA */ }
  <Modal visible={helpVisible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View
        style={[styles.helpCard, { backgroundColor: themeColors.card }]}
      >
        <View style={styles.helpHeader}>
          <MaterialIcons
            name="help"
            size={28}
            color={themeColors.primary}
          />
          <Text
            style={[styles.helpTitle, { color: themeColors.text }]}
          >
            {help.title}
          </Text>
        </View>

        <FlatList
          data={help.content}
          keyExtractor={(_, i) => `help-${i}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.helpBlock}>
              <View style={styles.helpSubtitleRow}>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={themeColors.primary}
                />
                <Text
                  style={[
                    styles.helpSubtitle,
                    { color: themeColors.text },
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>

              <Text
                style={[
                  styles.helpContent,
                  { color: themeColors.text },
                ]}
              >
                {formatHelpText(item.content)}
              </Text>

              <View
                style={[
                  styles.helpDivider,
                  { borderColor: themeColors.border },
                ]}
              />
            </View>
          )}
        />

        <TouchableOpacity
          onPress={() => setHelpVisible(false)}
          style={[
            styles.closeButton,
            { backgroundColor: themeColors.primary },
          ]}
        >
          <MaterialIcons name="close" size={22} color="#fff" />
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
    </SafeAreaView>
     
  );
}

// ===========================================================
//  ESTILOS
// ===========================================================
const styles = StyleSheet.create({
  header: {
    padding: 10,
    gap: 8,
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  titleSmall: { fontSize: 16, fontWeight: "700" },

  headerBottomRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 14 },

  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  productoContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  infoLeft: { flex: 1 },
  nombre: { fontSize: 14, fontWeight: "600", marginBottom: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  helpCard: {
    width: "92%",
    maxHeight: "85%",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignSelf: "center",
  },

  helpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    gap: 8,
  },

  helpTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  helpBlock: {
    marginBottom: 12,
  },

  helpSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  helpSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },

  helpContent: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 24,
  },

  helpDivider: {
    borderBottomWidth: 1,
    marginTop: 10,
    marginBottom: 4,
    opacity: 0.25,
  },

  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    gap: 6,
  },

  closeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

const formatHelpText = (text: string) => {
  return text
    .replace(/•/g, "\n• ")
    .replace(/(\d+\.)/g, "\n$1 ")
    .replace(/\n\s+/g, "\n")
    .trim();
};
