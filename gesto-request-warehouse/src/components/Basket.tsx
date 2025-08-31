import { useAppTheme } from "@/providers/ThemeProvider";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  activateRequest,
  getProductsSaved,
  makeMovement,
  syncProducts,
} from "@/services/pedidos.service";

const standar: Record<string, string> = { mass: "g", units: "u", volume: "mL", distance: "cm" };
// aceptar coma o punto, hasta 2 decimales
const cantidadRegex = /^\d*[.,]?\d{0,2}$/;

interface BasketProps {
  title: string;
  url: "checkout" | string;
  help: {
    title: string;
    image: any; // ImageSourcePropType
    content: { subtitle: string; content: string }[];
  };
}

function normalize(str: string) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Basket({ title, url, help }: BasketProps) {
  const [productos, setProductos] = useState<any[]>([]);
  const [areaName, setAreaName] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [hasReported, setHasReported] = useState(false);

  const [helpVisible, setHelpVisible] = useState(false);
  const [confirmState, setConfirmState] = useState<{ visible: boolean; accion?: string }>({
    visible: false,
  });

  const [query, setQuery] = useState("");
  const inputsRef = useRef<any[]>([]);
  const listRef = useRef<FlatList<any>>(null);

  // ⬇️ IDs marcados por el usuario (multiselección)
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());

  const { theme } = useAppTheme();
  const isDark = theme === "dark";
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
    warning: "#e67e22",
    disabled: isDark ? "#4b5563" : "#bdc3c7",
    markBgLight: "#e0f2fe",   // celeste claro
    markBgDark: "#0b3b57",    // celeste oscuro para dark
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [url])
  );

  const load = async () => {
    try {
      const areaId = await AsyncStorage.getItem("selectedLocal");
      const areaName = await AsyncStorage.getItem("selectedLocalName");
      if (!areaId) return router.push({ pathname: "/" });

      const saved = await getProductsSaved(url);
      setProductos(saved);                  // mantener referencia limpia; no clonar innecesariamente
      setAreaName(areaName || "");
      setHasReported(saved.some((p: any) => !!p.reported));
    } catch (e) {
      Alert.alert("Error cargando los productos", String(e));
    }
  };

  // sincronización con debounce
  useEffect(() => {
    if (!productos?.length) return;
    const timer = setTimeout(async () => {
      try {
        setSyncStatus("loading");
        await syncProducts(url, productos);
        setSyncStatus("success");
      } catch {
        setSyncStatus("error");
      } finally {
        setTimeout(() => setSyncStatus("idle"), 500);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [productos, url]);

  const actualizarCantidad = useCallback((id: string, nuevaCantidad: string) => {
    if (!cantidadRegex.test(nuevaCantidad)) return;
    if (url === "checkout") setHasReported(false);
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: nuevaCantidad } : p))
    );
  }, [url]);

  const handleSubmit = useCallback((index: number, dataLength: number) => {
    if (index + 1 < dataLength) {
      const nextRef = inputsRef.current[index + 1];
      if (nextRef?.focus) nextRef.focus();
    } else {
      Keyboard.dismiss();
    }
  }, []);

  const renderSyncStatus = () => {
    switch (syncStatus) {
      case "loading":
        return <ActivityIndicator size="small" color={themeColors.primary} />;
      case "success":
        return <MaterialIcons name="check" size={18} color={themeColors.success} />;
      case "error":
        return <MaterialIcons name="error" size={18} color={themeColors.danger} />;
      default:
        return null;
    }
  };

  const getContainerStyle = useCallback((item: any) => {
    const quantity = parseFloat(item.quantity ?? "0");
    const stockParsed = parseFloat(item.stock);
    const stock=isNaN(stockParsed)?0:stockParsed
    if (isNaN(stock) || quantity === 0)
      return [
        styles.productoContainer,
        { backgroundColor: themeColors.card, borderColor: themeColors.border },
      ] as const;
    if (quantity > stock ||  (isNaN(stock) && quantity > 0) )
      return [
        styles.productoContainer,
        { borderColor: themeColors.danger, backgroundColor: isDark ? "#ed6a5b" : "#fdecea" },
      ] as const;
    return [
      styles.productoContainer,
      { borderColor: themeColors.success, backgroundColor: isDark ? "#16351f" : "#eafaf1" },
    ] as const; // fondo dark más suave para evitar cambios bruscos
  }, [isDark, themeColors]);

  const hayExcesoDeCantidad = productos.some((p) => {
    const quantityParsed= parseFloat(p.quantity)
    const stockParsed= parseFloat(p.stock)

    const qty = isNaN(quantityParsed)?0:quantityParsed;
    const stk = isNaN(stockParsed)?0:stockParsed;
    return qty > stk;
  });

  const ejecutarAccion = async (accion: string) => {
    try {
      if (accion === "Enviar Pedido") {
        await activateRequest();
        Alert.alert("Pedido enviado");
        setHasReported(true);
      }
      if (accion === "Mover al área") {
        try {
          await makeMovement();
          Alert.alert("Movimiento realizado");
          await AsyncStorage.removeItem("requestId");
          router.push({ pathname: "/" });
        } catch {
          Alert.alert("No se ha realizado el movimiento");
        }
      }
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  };

  const handleAction = (accion: string) => {
    setConfirmState({ visible: true, accion });
  };

  const filteredProductos = useMemo(() => {
    const q = normalize(query);
    if (!q) return productos;
    return productos.filter((p) => normalize(p.name).includes(q));
  }, [productos, query]);

  const onSearchFocus = useCallback(() => {
    if (!query) return;
    setQuery("");
  }, [query]);

  const toggleMarked = useCallback((id: string) => {
    setMarkedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // === renderItem MEMOIZADO (evita remontajes que quitan foco) ===
  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const isMarked = markedIds.has(String(item.id));
      const containerStyles = [
        ...getContainerStyle(item),
        isMarked && {
          borderColor: themeColors.primary,
          backgroundColor: isDark ? themeColors.markBgDark : themeColors.markBgLight,
          borderWidth: 3,
        },
      ];

      return (
        <View style={containerStyles as any}>
          <View style={styles.row}>
            <Pressable style={styles.infoLeft} onPress={() => toggleMarked(String(item.id))}>
              <Text style={[styles.nombre, { color: themeColors.text }]}>
                {item.name} ({standar[item.unitOfMeasureId]})
              </Text>
              {!!item.stock && <Text style={{ color: themeColors.text }}>Stock: {item.stock}</Text>}
              {!!item.netContent && (
                <Text style={{ color: themeColors.text }}>
                  Contenido neto: {item.netContent} {standar[item.netContentUnitOfMeasureId]}
                </Text>
              )}
            </Pressable>

            <TextInput
              ref={(ref) => {
                if (ref) inputsRef.current[index] = ref;
              }}
              style={[
                styles.inputFlex,
                {
                  backgroundColor: themeColors.inputBg,
                  color: themeColors.inputText,
                  borderColor: themeColors.border,
                },
              ]}
              keyboardType="decimal-pad"
              inputMode="decimal"
              editable={true}
              value={item.quantity?.toString() || ""}
              onChangeText={(text) => actualizarCantidad(item.id, text)}
              onSubmitEditing={() => handleSubmit(index, filteredProductos.length)}
              placeholder="Cantidad"
              blurOnSubmit={false}
              placeholderTextColor="#888"
              returnKeyType="next"
            />
          </View>
        </View>
      );
    },
    [
      actualizarCantidad,
      filteredProductos.length,
      getContainerStyle,
      isDark,
      markedIds,
      themeColors.border,
      themeColors.inputBg,
      themeColors.inputText,
      themeColors.primary,
      themeColors.text,
      themeColors.markBgDark,
      themeColors.markBgLight,
      toggleMarked,
      handleSubmit,
    ]
  );

  const ConfirmDialog = ({
    visible,
    text,
    onCancel,
    onConfirm,
  }: {
    visible: boolean;
    text: string;
    onCancel: () => void;
    onConfirm: () => void;
  }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.confirmText, { color: themeColors.text }]}>{text}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={onCancel}
                style={[styles.actionButton, { backgroundColor: themeColors.disabled }]}
              >
                <Text style={styles.actionText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
              >
                <Text style={styles.actionText}>Sí</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: themeColors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={60}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: themeColors.card }]}>
            {/* fila superior */}
            <View style={styles.headerTopRow}>
              <Text
                style={[styles.titleSmall, { color: themeColors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
                {url === "checkout" ? ` - ${areaName}` : ``}
              </Text>

              <View style={styles.topRight}>
                <View style={styles.syncIcon}>{renderSyncStatus()}</View>
                <TouchableOpacity
                  onPress={() => setHelpVisible(true)}
                  style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                >
                  <Text style={styles.actionText}>Ayuda</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* alerta */}
            {hayExcesoDeCantidad && (
              <View style={styles.warningBanner}>
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13, textAlign: "center" }}>
                  ⚠️ Cantidad mayor al stock en algunos productos.
                </Text>
              </View>
            )}

            {/* buscador + botones */}
            <View style={styles.headerBottomRow}>
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: themeColors.inputBg, borderColor: themeColors.border },
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
                  style={[styles.searchInput, { color: themeColors.inputText }]}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {!!query && (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <MaterialIcons name="close" size={18} color="#888" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.bottomRight}>
                <TouchableOpacity
                  onPress={load}
                  style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                >
                  <Text style={styles.actionText}>Actualizar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => !hayExcesoDeCantidad && handleAction("Mover al área")}
                  style={[
                    styles.actionButton,
                    (hayExcesoDeCantidad || !hasReported) && styles.disabledButton,
                  ]}
                  disabled={hayExcesoDeCantidad || !hasReported}
                >
                  <Text
                    style={[
                      styles.actionText,
                      (hayExcesoDeCantidad || !hasReported) && styles.disabledText,
                    ]}
                  >
                    {hayExcesoDeCantidad
                      ? "Stock insuficiente"
                      : !hasReported
                      ? "Esperando aprovación"
                      : "Mover al área"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Lista virtualizada */}
          <FlatList
            ref={listRef}
            data={filteredProductos}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            extraData={markedIds}                              // evita tocar data al marcar
            contentContainerStyle={{
              backgroundColor: themeColors.background,
              paddingHorizontal: 10,
              paddingTop: 10,
              paddingBottom: 10,
            }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            scrollEventThrottle={16}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={10}
            removeClippedSubviews={Platform.OS === "ios"}      // 🔑 Android=false para no perder foco
          />
        </View>
      </KeyboardAvoidingView>

      {/* Modal de ayuda */}
      <Modal
        visible={helpVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{help.title}</Text>
            <FlatList
              data={help.content}
              keyExtractor={(_, i) => `help-${i}`}
              style={{ maxHeight: "80%" }}
              renderItem={({ item }) => (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontWeight: "600", color: themeColors.text }}>
                    {item.subtitle}
                  </Text>
                  <Text style={{ color: themeColors.text }}>{item.content}</Text>
                </View>
              )}
            />
            <TouchableOpacity
              onPress={() => setHelpVisible(false)}
              style={[styles.actionButton, { backgroundColor: themeColors.danger, marginTop: 10 }]}
            >
              <Text style={styles.actionText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmación */}
      <ConfirmDialog
        visible={confirmState.visible}
        text={`¿Desea ${confirmState.accion}?`}
        onCancel={() => setConfirmState({ visible: false })}
        onConfirm={() => {
          const a = confirmState.accion!;
          setConfirmState({ visible: false });
          ejecutarAccion(a);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  warningBanner: {
    marginHorizontal: 10,
    backgroundColor: "#e67e22",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
  },

  header: {
    padding: 10,
    elevation: 4,
    zIndex: 10,
    gap: 8,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  titleSmall: { fontSize: 16, fontWeight: "700", flexShrink: 1 },

  headerBottomRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  bottomRight: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },

  productoContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    overflow: "hidden",
  },

  row: { flexDirection: "row", alignItems: "stretch", gap: 10 },

  // Info producto
  infoLeft: { flex: 1, flexShrink: 1 },

  nombre: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    flexWrap: "wrap",
  },

  // Input único: mínimo 20% del contenedor (sin ancho fijo)
  inputFlex: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: "right",
    flexBasis: "20%",
    minWidth: 80,
    flexShrink: 1,
  },

  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 12,
    padding: 16,
    width: 520,
    maxWidth: "100%",
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  confirmCard: {
    borderRadius: 12,
    padding: 16,
    width: 360,
    maxWidth: "90%",
    alignSelf: "center",
  },
  confirmText: { fontSize: 16, marginBottom: 12 },
  confirmActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  actionButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  syncIcon: { marginLeft: 6, alignItems: "center", justifyContent: "center" },
  disabledButton: { backgroundColor: "#ffffff24" },
  disabledText: { color: "#7f8c8d" },
});
