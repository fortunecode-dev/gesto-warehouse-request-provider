import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { PanGestureHandler } from "react-native-gesture-handler";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

import { fetchMovements, undoMovement } from "@/services/pedidos.service";
import { useAppTheme } from "@/providers/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";

/* ===========================================================
   VISUAL LOGIC
=========================================================== */

function getMovementVisual(m) {
  const isEntrada = m.movementTypeDenomination == "Entrada";
  const isSalida = m.movementTypeDenomination == "Salida";

  if (isEntrada)
    return {
      type: "Entrada",
      color: "#22c55e",
      soft: "rgba(34,197,94,0.15)",
    };

  if (isSalida)
    return {
      type: "Salida",
      color: "#ef4444",
      soft: "rgba(239,68,68,0.15)",
    };

  return {
    type: "Traslado",
    color: "#eab308",
    soft: "rgba(234,179,8,0.15)",
  };
}

/* ===========================================================
   MOVEMENT CARD — SWIPE + TAP TOGGLE + RESPONSIVE
=========================================================== */

function MovementCard({
  children,
  movement,
  visual,
  onDelete,
  activeCard,
  setActiveCard,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const OPEN_X = -50;

  const isOpen = activeCard?.id === movement.id;

  const gestureEnabled = !activeCard || isOpen;

  const qtySize = 18;

  const handleGesture = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const openCard = () => {
    Animated.timing(translateX, {
      toValue: OPEN_X,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setActiveCard({ id: movement.id, translateX }));
  };

  const closeCard = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setActiveCard(null));
  };

  const toggleCard = () => {
    if (isOpen) closeCard();
    else openCard();
  };

  const handleEnd = ({ nativeEvent }) => {
    if (!gestureEnabled) return;

    if (nativeEvent.translationX < -60) {
      openCard();
    } else {
      closeCard();
    }
  };

  return (
    <Pressable onPress={toggleCard} style={{ marginBottom: 12 }}>
      <PanGestureHandler
        onGestureEvent={gestureEnabled ? handleGesture : undefined}
        onEnded={gestureEnabled ? handleEnd : undefined}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-10, 10]}
      >
        <Animated.View
          style={{
            transform: [{ translateX }],
            flexDirection: "row",
          }}
        >
          {/* MAIN CARD */}
          <View
            style={[
              styles.card,
              {
                flexGrow: 1,
                backgroundColor: visual.soft,
                borderColor: visual.color,
                marginRight: 0
              },
            ]}
          >
            {children(qtySize)}
          </View>

          {/* DELETE BUTTON */}
          <View
            style={[
              styles.deletePanel,
              // { marginRight:-30,
              //   marginLeft:10,
              // },
            ]}
          >
            <TouchableOpacity onPress={() => onDelete(movement)}>
              <MaterialIcons name="delete" size={26} color={visual.color} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Pressable>
  );
}

/* ===========================================================
    MAIN VIEW
=========================================================== */

export default function MovementsView() {
  const params = useLocalSearchParams<{ areaId?: string }>();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const { theme } = useAppTheme();
  const isDark = theme === "dark";

  // Colores dinámicos por tema
  const backgroundColor = isDark ? '#1F2937' : '#F9FAFB';
  const COLORS = {
    background: isDark ? "#111827" : "#f5f7fb",
    text: isDark ? "#f9fafb" : "#1e293b",
    textSecondary: isDark ? "#9ca3af" : "#64748b",
    inputBg: isDark ? "#1f2937" : "#ffffff",
    inputBorder: isDark ? "#4b5563" : "#d1d5db",
    placeholder: isDark ? "#6b7280" : "#94a3b8",
  };

  const [activeCard, setActiveCard] = useState(null);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    const movements = await fetchMovements(params.areaId);
    setData(movements);
    setLoading(false);
  }, [params.areaId]);

  useFocusEffect(
    useCallback(() => {
      loadMovements();
    }, [loadMovements])
  );

  const filtered = useMemo(() => {
    return data.filter(
      (m) =>
        m.itemName.toLowerCase().includes(search.toLowerCase()) ||
        m.quantity.toString().includes(search.toLowerCase())
    );
  }, [data, search]);

  const confirmDelete = (m) => {
    const f = parseISO(m.movementDate);

    const fecha = format(f, "dd MMM yyyy • HH:mm", { locale: es });

    Alert.alert(
      "Eliminar movimiento",
      `Producto: ${m.itemName}
Cantidad: ${m.quantity}
Tipo: ${m.movementTypeDenomination}

Origen: ${m.originLocal} - ${m.originArea}
Destino: ${m.destinationLocal} - ${m.destinationArea}

Fecha: ${fecha}

¿Deseas eliminarlo?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await undoMovement(m.id);
            loadMovements();
          },
        },
      ]
    );
  };

  if (loading)
    return (
      <View style={[styles.loader, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={() => {
        if (activeCard) {
          Animated.timing(activeCard.translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => setActiveCard(null));
        }
      }}
    >
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        <View style={styles.searchBox}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por producto o cantidad..."
            placeholderTextColor={COLORS.placeholder}
            style={[
              styles.searchInput,
              {
                backgroundColor: COLORS.inputBg,
                borderColor: COLORS.inputBorder,
                color: COLORS.text,
              },
            ]}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item: m }) => {
            const visual = getMovementVisual(m);
            const f = parseISO(m.movementDate);

            const diaMes = format(f, "dd MMM", { locale: es });
            const año = format(f, "yyyy");
            const hora = format(f, "HH:mm");

            return (
              <MovementCard
                movement={m}
                visual={visual}
                onDelete={confirmDelete}
                activeCard={activeCard}
                setActiveCard={setActiveCard}
              >
                {(qtySize) => (
                  <>
                    <View style={styles.line1}>
                      <View style={styles.colName}>
                        <Text
                          style={[styles.product, { color: COLORS.text }]}
                          numberOfLines={1}
                        >
                          {m.itemName}
                        </Text>
                        <Text>
                          <Text
                            style={[styles.year, { color: COLORS.textSecondary }]}
                          >
                            De:  <Text style={{ color: COLORS.text }}>
                              {m.originArea} -
                              <Text
                                style={[
                                  styles.localName,
                                  { color: COLORS.textSecondary },
                                ]}
                              >
                                {m.originLocal}
                              </Text>

                            </Text>
                          </Text>
                        </Text>
                        <Text>
                          <Text
                            style={[styles.year, { color: COLORS.textSecondary }]}
                          >
                            A: <Text style={{ color: COLORS.text }}>
                              {m.destinationArea} -
                              <Text
                                style={[
                                  styles.localName,
                                  { color: COLORS.textSecondary },
                                ]}
                              >
                                {m.destinationLocal}
                              </Text>
                            </Text>
                          </Text>
                        </Text>

                      </View>

                      <View style={styles.colQty}>
                        <Text
                          style={[
                            styles.qty,
                            { color: visual.color, fontSize: qtySize },
                          ]}
                        >
                          {Number(m.quantity)} {m.unit?.abbreviation}
                        </Text>
                      </View>

                      <View style={styles.colDate}>
                        <Text style={[styles.dayMonth, { color: COLORS.text }]}>
                          {diaMes}
                        </Text>
                        <Text
                          style={[styles.hour, { color: COLORS.textSecondary }]}
                        >
                          {hora}
                        </Text>
                        <Text
                          style={[styles.year, { color: COLORS.textSecondary }]}
                        >
                          {año}
                        </Text>
                      </View>
                    </View>

                    {/* <View style={styles.line2}>
                      <Text style={{ color: COLORS.text }}>
                        {m.originArea} -
                        <Text
                          style={[
                            styles.localName,
                            { color: COLORS.textSecondary },
                          ]}
                        >
                          {m.originLocal}
                        </Text>
                      </Text>

                      <Text style={[styles.arrow, { color: visual.color }]}>
                        ➜
                      </Text>

                      <Text style={{ color: COLORS.text }}>
                        {m.destinationArea} -
                        <Text
                          style={[
                            styles.localName,
                            { color: COLORS.textSecondary },
                          ]}
                        >
                          {m.destinationLocal}
                        </Text>
                      </Text>
                    </View> */}
                  </>
                )}
              </MovementCard>
            );
          }}
        />
      </View>
    </Pressable>
  );
}

/* ===========================================================
    STYLES
=========================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  searchBox: { flexDirection: "row", marginBottom: 14 },

  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },

  deletePanel: {
    width: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },

  deleteText: {
    color: "#fff",
    marginTop: 4,
    fontWeight: "600",
    fontSize: 12,
  },

  /* CARD - OPTIMIZADO PARA 400PX */
  card: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
  },

  line1: {
    flexDirection: "row",
    alignItems: "center",
  },

  colName: { width: "65%" },
  colQty: { width: "23%", alignItems: "flex-end" },
  colDate: { width: "12%", alignItems: "flex-end" },

  qty: {
    fontWeight: "600",
  },

  product: { fontSize: 14, fontWeight: "700" },
  dayMonth: { fontSize: 13, fontWeight: "700" },
  hour: { fontSize: 12, fontWeight: "700" },
  year: { fontSize: 11 },

  line2: {
    flexDirection: "row",
    marginTop: 2,
    justifyContent: "space-between",
  },

  arrow: {
    marginHorizontal: 8,
    fontSize: 13,
    fontWeight: "900",
  },

  localName: { fontSize: 12, fontWeight: "500" },
});
