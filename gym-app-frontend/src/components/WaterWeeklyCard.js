import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import WaterGlassFill from "./WaterGlassFill";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function WaterWeeklyCard({
  goalMl,
  todayMl,
  progress,
  week,
  streak,
  onAdd,
  onReset,
  onSetGoal,
  loading,
}) {
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const COLORS = useMemo(
    () => ({
      bg: colors.surfaceMuted,
      white: colors.white,
      textDark: colors.textDark,
      textMain: colors.textMain,
      textLight: colors.textLight,
      primary: colors.dietPrimary,
      primaryLight: colors.dietPrimaryLight,
      aqua: colors.aqua,
      accent: colors.dietAccent,
      border: colors.border,
      redish: colors.dietRedish,
    }),
    [colors]
  );
  const styles = useMemo(() => createWaterWeeklyCardStyles(COLORS), [COLORS]);

  const initialGoal = useMemo(() => String(goalMl ?? 2500), [goalMl]);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState(initialGoal);

  const daysAchieved = week?.days?.filter((d) => d.done).length || 0;

  const openGoalModal = () => {
    setGoalInput(initialGoal);
    setGoalModalVisible(true);
  };

  const confirmGoal = async () => {
    const parsed = Number(goalInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const next = await onSetGoal?.(parsed);
    if (typeof next === "number") {
      // HomePage state güncellenince input otomatik eski değeri alır.
    }
    setGoalModalVisible(false);
  };

  const askReset = () => {
    Alert.alert(
      t("water.reset"),
      t("water.resetMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("water.reset"), style: "destructive", onPress: () => onReset?.() },
      ]
    );
  };

  return (
    <View style={[styles.card, styles.shadowLight]}>
      {/* HEADER: Başlık ve Streak */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: "rgba(65, 179, 162, 0.1)" }]}>
            <Ionicons name="water-outline" size={22} color={COLORS.aqua} />
          </View>
          <Text style={styles.title}>{t("water.title")}</Text>
        </View>

        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{t("water.streak", { count: streak || 0 })}</Text>
        </View>
      </View>

      {/* PROGRESS DISPLAY */}
      <View style={styles.progressSection}>
        <Text style={styles.mililitre}>{t("water.milliliter")}</Text>
        <Text style={styles.progressValue}>
          {todayMl}{" "}
          <Text style={styles.goalValue}>
            {t("water.goal", { goalMl })}
          </Text>
        </Text>

        <WaterGlassFill todayMl={todayMl} goalMl={goalMl} />

        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.round((progress || 0) * 100)}%` },
            ]}
          />
        </View>

        <Pressable style={styles.goalUpdateButton} onPress={openGoalModal}>
          <Text style={styles.goalUpdateButtonText}>{t("water.changeGoal")}</Text>
        </Pressable>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.btnRow}>
        <Pressable
          style={[styles.btn, { borderColor: COLORS.aqua, backgroundColor: "rgba(65, 179, 162, 0.05)" }]}
          onPress={() => onAdd?.(250)}
        >
          <Text style={[styles.btnText, { color: COLORS.aqua }]}>+250ml</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, { borderColor: COLORS.aqua, backgroundColor: "rgba(65, 179, 162, 0.05)" }]}
          onPress={() => onAdd?.(500)}
        >
          <Text style={[styles.btnText, { color: COLORS.aqua }]}>+500ml</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnDanger]} onPress={askReset}>
          <Text style={[styles.btnText, { color: COLORS.white }]}>{t("water.reset")}</Text>
        </Pressable>
      </View>

      {/* WEEKLY STATUS AND LOADING */}
      <View style={styles.statusFooter}>
        <Text style={styles.weeklyTitle}>
          {t("water.weeklyGoal", { days: daysAchieved })}
        </Text>

        <View style={styles.daysRow}>
          {week?.days?.map((day, index) => {
            let label = "";
            try {
              label = new Date(`${day.date}T12:00:00`).toLocaleDateString(language === "en" ? "en-US" : "tr-TR", {
                weekday: "short",
              });
            } catch {
              label = "";
            }
            return (
              <View key={index} style={styles.dayCol}>
                <View style={[styles.dayDot, day.done && styles.dayDotAchieved]} />
                {label ? (
                  <Text style={styles.dayLabel} numberOfLines={1}>
                    {label.replace(".", "")}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.aqua} style={{ marginRight: 6 }} />
            <Text style={styles.small}>{t("common.loading")}</Text>
          </View>
        )}
      </View>

      {/* GOAL MODAL */}
      <Modal visible={goalModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("water.dailyGoal")}</Text>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setGoalModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={confirmGoal}>
                <Text style={styles.modalConfirmText}>{t("common.save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createWaterWeeklyCardStyles(COLORS) {
  return StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shadowLight: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: {
    color: COLORS.textDark,
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240, 138, 108, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 12,
  },

  // PROGRESS SECTION
  progressSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  mililitre: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "500",
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 44,
    fontWeight: "900",
    color: COLORS.aqua,
    letterSpacing: -1.5,
  },
  goalValue: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  barBg: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F0F0F3",
    marginTop: 15,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: COLORS.aqua,
  },

  // ACTION BUTTONS
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 25,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F0F0F3",
    backgroundColor: COLORS.bg,
  },
  btnDanger: {
    borderColor: COLORS.redish,
    backgroundColor: COLORS.redish,
  },
  btnText: {
    fontWeight: "700",
    fontSize: 13,
  },

  // STATUS FOOTER
  statusFooter: {
    flexDirection: "column",
    alignItems: "center",
  },
  weeklyTitle: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: "700",
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  dayCol: {
    alignItems: "center",
    minWidth: 28,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F0F0F3",
  },
  dayLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.textLight,
    maxWidth: 36,
    textAlign: "center",
  },
  dayDotAchieved: {
    backgroundColor: COLORS.aqua,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  small: {
    color: COLORS.textLight,
    fontSize: 12,
  },

  // GOAL UPDATE
  goalUpdateButton: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  goalUpdateButtonText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.textDark,
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontWeight: "800",
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: COLORS.textLight,
    fontWeight: "900",
    fontSize: 13,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: COLORS.aqua,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13,
  },
  });
}
