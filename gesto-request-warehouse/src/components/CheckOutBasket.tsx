// ===========================================================
//  Basket (Checkout Only)
//  — Limpio, optimizado y exclusivamente para mover al área —
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
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    getProductsSaved,
    syncProducts,
    makeMovement,
} from "@/services/pedidos.service";
import { API_URL } from "@/config";

const unidades = { mass: "g", units: "u", volume: "mL", distance: "cm" };
const regexCantidad = /^\d*[.,]?\d{0,2}$/;

// ===========================================================
//  COMPONENTE PRINCIPAL — Checkout Exclusivo
// ===========================================================
export function CheckoutBasket({ title = "Pedido", help }: { title?: string; help: any }) {
    const CHECKOUT_URL = "checkout";

    const [productos, setProductos] = useState<any[]>([]);
    const [areaName, setAreaName] = useState("");
    const [syncStatus, setSyncStatus] = useState("idle");
    const [helpVisible, setHelpVisible] = useState(false);
    const [query, setQuery] = useState("");

    const inputsRef = useRef<any>([]);
    const listRef = useRef<FlatList>(null);
    const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());

    const { theme } = useAppTheme();
    const isDark = theme === "dark";
    const [serverOnline, setServerOnline] = useState<boolean>(true);
    const [alertedOffline, setAlertedOffline] = useState(false);
    const [trying, setTrying] = useState(false);

    // 🔄 Health check cada 5 segundos
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                if (alertedOffline) setTrying(true)
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
            setTrying(false)
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
    //  Cargar productos + área
    // ===========================================================
    const load = async () => {
        try {
            const areaId = await AsyncStorage.getItem("selectedLocal");
            const areaName = await AsyncStorage.getItem("selectedLocalName");
            if (!areaId) return router.push("/");

            const saved = await getProductsSaved(CHECKOUT_URL);
            setProductos(saved);
            setAreaName(areaName || "");
        } catch (e) {
            Alert.alert("Error cargando", String(e));
        }
    };

    useFocusEffect(useCallback(() => { load() }, []));

    // ===========================================================
    //  Auto-sincronización con debounce
    // ===========================================================
    useEffect(() => {
        if (!productos.length) return;

        const timer = setTimeout(async () => {
            try {
                setSyncStatus("loading");
                await syncProducts(CHECKOUT_URL, productos);
                setSyncStatus("success");
            } catch {
                setSyncStatus("error");
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [productos]);

    // ===========================================================
    //  Actualizar cantidad
    // ===========================================================
    const actualizarCantidad = useCallback((id: string, cantidad: string) => {
        if (!regexCantidad.test(cantidad)) return;
        setProductos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, quantity: cantidad } : p))
        );
    }, []);

    // ===========================================================
    //  Buscar productos
    // ===========================================================
    const normalize = (s: string) =>
        (s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    const filteredProductos = useMemo(() => {
        const q = normalize(query);
        if (!q) return productos;
        return productos.filter((p) => normalize(p.name).includes(q));
    }, [query, productos]);

    // ===========================================================
    //  Validación de stock insuficiente
    // ===========================================================
    const hayExcesoDeCantidad = productos.some((p) => {
        const qty = parseFloat(p.quantity) || 0;
        const stk = parseFloat(p.stock) || 0;
        return qty > stk;
    });

    // ===========================================================
    //  Acción principal — Mover al área
    // ===========================================================
    const moverAlArea = async () => {
        const response = await makeMovement(productos);
        if (!response)
            return Alert.alert("Error", "No se logró mover al área");
        Alert.alert("Movimiento realizado");
        await AsyncStorage.removeItem("requestId");
        router.push("/");

    };

    // ===========================================================
    //  Render del estado de sincronización
    // ===========================================================
    const renderSync = () => {
        if (syncStatus === "loading")
            return <ActivityIndicator size={25} color={themeColors.primary} />;

        if (syncStatus === "success")
            return <MaterialIcons name="check-circle" size={25} color={themeColors.success} />;

        if (syncStatus === "error")
            return <MaterialIcons name="error" size={25} color={themeColors.danger} />;
    };
    const renderServerStatus = () => {
        return trying ? <ActivityIndicator size={25} color={themeColors.primary} /> : serverOnline ? (
            <MaterialIcons name="cloud-done" size={28} color={themeColors.success} />
        ) : (
            <MaterialIcons name="cloud-off" size={28} color={themeColors.danger} />
        );
    };



    // ===========================================================
    //  Render item optimizado
    // ===========================================================
    const renderItem = useCallback(
        ({ item, index }: any) => {
            const quantity = parseFloat(item.quantity) || 0;
            const stock = parseFloat(item.stock) || 0;
            const exceso = quantity > stock && quantity > 0;

            const isMarked = markedIds.has(String(item.id));

            // Estado neutro: cantidad = 0
            const isNeutral = quantity === 0;

            // Base: estilo neutro
            let borderColor = themeColors.border;
            let backgroundColor = themeColors.card;

            // Caso rojo (exceso)
            if (exceso) {
                borderColor = themeColors.danger;
                backgroundColor = isDark ? "#5b1a16" : "#fdecea";
            }
            // Caso verde (cantidad > 0 && dentro del stock)
            else if (!isNeutral) {
                borderColor = themeColors.success;
                backgroundColor = isDark ? "#16351f" : "#eafaf1";
            }

            // Caso marcado – SOLO si NO está en rojo
            if (isMarked && !exceso) {
                borderColor = themeColors.primary;
                backgroundColor = isDark ? themeColors.markBgDark : themeColors.markBgLight;
            }

            // Construcción final
            const container = [
                styles.productoContainer,
                {
                    borderColor,
                    backgroundColor,
                    borderWidth: isMarked ? 4 : 1,
                },
            ];

            const toggleMarked = () => {
                setMarkedIds((prev) => {
                    const next = new Set(prev);
                    const id = String(item.id);
                    next.has(id) ? next.delete(id) : next.add(id);
                    return next;
                });
            };

            return (
                <View style={container}>
                    <View style={styles.row}>

                        {/* ZONA MARCABLE */}
                        <Pressable
                            onPress={toggleMarked}
                            style={[styles.infoLeft, { paddingRight: 6 }]}
                        >
                            <Text style={[styles.nombre, { color: themeColors.text }]}>
                                {item.name} ({unidades[item.unitOfMeasureId]})
                            </Text>
                            <Text style={{ color: themeColors.text }}>Stock: {item.stock}</Text>
                        </Pressable>

                        {/* INPUT DE CANTIDAD */}
                        <TextInput
                            ref={(ref) => { if (ref) inputsRef.current[index] = ref }}
                            style={[
                                styles.inputFlex,
                                {
                                    backgroundColor: themeColors.inputBg,
                                    color: themeColors.inputText,
                                    borderColor: themeColors.border,
                                },
                            ]}
                            keyboardType="decimal-pad"
                            value={item.quantity}
                            onChangeText={(v) => actualizarCantidad(item.id, v)}
                        />
                    </View>
                </View>
            );
        },
        [themeColors, actualizarCantidad, markedIds]
    );


    // ===========================================================
    //  UI
    // ===========================================================
    return (
        <>
            {/* ======== CONTENEDOR PRINCIPAL ======== */}
            <KeyboardAvoidingView
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
                                {/* Indicador de sincronización local */}
                                <View style={{ marginRight: 4 }}>
                                    {renderSync()}
                                </View>

                                {/* Indicador de conexión con el servidor */}
                                {renderServerStatus()}

                                <TouchableOpacity
                                    onPress={() => setHelpVisible(true)}
                                    style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                                >
                                    <Text style={styles.actionText}>Ayuda</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Advertencia stock */}
                        {hayExcesoDeCantidad && (
                            <View style={styles.warningBanner}>
                                <Text style={styles.warningText}>
                                    ⚠️ Hay productos con cantidad mayor al stock.
                                </Text>
                            </View>
                        )}

                        {/* Buscador */}
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
                                    placeholder="Buscar..."
                                    placeholderTextColor="#888"
                                    style={[styles.searchInput, { color: themeColors.inputText }]}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={load}
                                style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                            >
                                <Text style={styles.actionText}>Actualizar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                disabled={hayExcesoDeCantidad || syncStatus == "error"}
                                onPress={moverAlArea}
                                style={[
                                    styles.actionButton,
                                    {
                                        backgroundColor: hayExcesoDeCantidad
                                            ? "#cccccc55"
                                            : themeColors.primary,
                                    },
                                ]}
                            >
                                <Text style={styles.actionText}>
                                    {syncStatus == "error" ? "Sin Conexión" : hayExcesoDeCantidad ? "Stock insuficiente" : "Mover al área"}
                                </Text>
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

            {/* ======== MODAL AYUDA MEJORADO ======== */}
            <Modal visible={helpVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.helpCard, { backgroundColor: themeColors.card }]}>

                        {/* HEADER */}
                        <View style={styles.helpHeader}>
                            <MaterialIcons name="help" size={28} color={themeColors.primary} />
                            <Text style={[styles.helpTitle, { color: themeColors.text }]}>
                                {help.title}
                            </Text>
                        </View>

                        {/* CONTENIDO SCROLLABLE */}
                        <FlatList
                            data={help.content}
                            keyExtractor={(_, i) => `help-${i}`}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item }) => (
                                <View style={styles.helpBlock}>

                                    {/* Subtítulo con icono */}
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

                                    {/* Contenido */}
                                    <Text style={[styles.helpContent, { color: themeColors.text }]}>
                                       {formatHelpText(item.content)}
                                    </Text>

                                    {/* Separador visual */}
                                    <View style={[styles.helpDivider, { borderColor: themeColors.border }]} />
                                </View>
                            )}
                        />

                        {/* BOTÓN DE CIERRE */}
                        <TouchableOpacity
                            onPress={() => setHelpVisible(false)}
                            style={[styles.closeButton, { backgroundColor: themeColors.primary }]}
                        >
                            <MaterialIcons name="close" size={22} color="#fff" />
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </>
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

    warningBanner: {
        backgroundColor: "#e67e22",
        padding: 6,
        borderRadius: 6,
    },
    warningText: { color: "#fff", fontSize: 13, textAlign: "center", fontWeight: "600" },

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

    row: { flexDirection: "row", gap: 10 },
    infoLeft: { flex: 1 },
    nombre: { fontSize: 14, fontWeight: "600", marginBottom: 4 },

    inputFlex: {
        borderWidth: 1,
        borderRadius: 6,
        padding: 8,
        minWidth: 80,
        textAlign: "right",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        padding: 20,
    },
    modalContainer: {
        borderRadius: 12,
        padding: 20,
        maxHeight: "90%",
    },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 }, helpCard: {
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
    // Salto antes de bullets •
    .replace(/•/g, '\n• ')
    // Salto antes de pasos numerados 1. 2. 3.
    .replace(/(\d+\.)/g, '\n$1 ')
    // Quita espacios dobles
    .replace(/\n\s+/g, '\n')
    .trim();
};