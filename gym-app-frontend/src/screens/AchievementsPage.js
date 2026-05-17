import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Layout from "../components/Layout";
import apiService from "../services/api";
import { showNotificationsIfNewlyUnlocked } from "../utils/achievementNotifications";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

const { width } = Dimensions.get("window");

const ICON_MAP = {
  dumbbell: "dumbbell",
  "food-apple": "food-apple",
  "account-check": "account-check",
  crown: "crown",
  "calendar-week": "calendar-week",
  "calendar-month": "calendar-month",
  "flag-checkered": "flag-checkered",
};

function iconForKey(iconKey) {
  return ICON_MAP[iconKey] || "trophy-award";
}

function createAchievementsPageStyles(COLORS) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.white,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginLeft: 15 },
    scroll: { padding: 20, paddingBottom: Platform.OS === "ios" ? 100 : 120 },
    centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    errorText: { color: COLORS.textMain, textAlign: "center", marginBottom: 12 },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
    retryBtnText: { color: "#FFF", fontWeight: "800" },

    levelCard: { borderRadius: 24, padding: 20, marginBottom: 22 },
    levelRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    levelCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#FFF",
    },
    levelNum: { fontSize: 22, fontWeight: "900", color: "#FFF" },
    levelLabel: { fontSize: 8, fontWeight: "700", color: "#FFF" },
    expInfo: { marginLeft: 15, flex: 1 },
    expText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
    expValue: { color: "#FFF", fontSize: 22, fontWeight: "900" },
    expSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4, fontWeight: "600" },
    barBg: { height: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 5 },
    barFill: { height: "100%", backgroundColor: "#FFF", borderRadius: 5 },
    barCaption: { color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 8, fontWeight: "600" },
    barSubCaption: { color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 4, fontWeight: "500" },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: COLORS.textMain,
      marginBottom: 12,
      letterSpacing: 1,
    },
    achGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    achCard: {
      width: (width - 60) / 2,
      backgroundColor: COLORS.white,
      borderRadius: 20,
      padding: 14,
      marginBottom: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
      position: "relative",
      minHeight: 168,
    },
    achIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      borderWidth: 2,
    },
    achTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textDark, textAlign: "center" },
    achDesc: { fontSize: 10, color: COLORS.textMain, textAlign: "center", marginTop: 4, flex: 1 },
    achXp: { fontSize: 11, color: COLORS.primary, fontWeight: "800", marginTop: 6 },
    lock: { position: "absolute", top: 10, right: 10 },
  });
}

const AchievementsPage = ({ navigation }) => {
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const COLORS = useMemo(
    () => ({
      bg: C.bg,
      white: C.white,
      primary: C.primary,
      primaryDark: C.primaryDark,
      purple: C.purple,
      accent: C.accent,
      textDark: C.textDark,
      textMain: C.textMain,
      border: C.border,
      success: C.success,
      bronze: C.bronze,
      silver: C.silver,
      gold: C.gold,
    }),
    [C]
  );
  const styles = useMemo(() => createAchievementsPageStyles(COLORS), [COLORS]);
  const tierRing = useMemo(
    () => ({
      bronze: COLORS.bronze,
      silver: COLORS.silver,
      gold: COLORS.gold,
      null: COLORS.border,
      undefined: COLORS.border,
    }),
    [COLORS]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [summary, setSummary] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiService.getAchievements();
      if (res?.success && res.data) {
        setAchievements(res.data.achievements || []);
        setSummary(res.data.summary || null);
        showNotificationsIfNewlyUnlocked(res);
      } else {
        setError(res?.message || t("achievements.loadError"));
      }
    } catch (e) {
      setError(e?.message || t("achievements.connectionError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const progressPct = summary ? Math.round((summary.progressToNextLevel || 0) * 100) : 0;

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("achievements.title")}</Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>{t("achievements.retry")}</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.levelCard}
            >
              <View style={styles.levelRow}>
                <View style={styles.levelCircle}>
                  <Text style={styles.levelNum}>{summary?.level ?? 1}</Text>
                  <Text style={styles.levelLabel}>{t("achievements.level")}</Text>
                </View>
                <View style={styles.expInfo}>
                  <Text style={styles.expText}>{t("achievements.totalXp")}</Text>
                  <Text style={styles.expValue}>{summary?.totalXp ?? 0}</Text>
                  <Text style={styles.expSub}>
                    {t("achievements.badgeCount", {
                      unlocked: summary?.unlockedCount ?? 0,
                      total: summary?.totalDefinitions ?? 0,
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.barCaption}>
                {t("achievements.nextLevel", {
                  current: summary?.xpIntoLevel ?? 0,
                  next: summary?.xpForNextLevel ?? 100,
                })}
              </Text>
              {summary != null && (summary.badgeXp > 0 || summary.activityXp > 0) ? (
                <Text style={styles.barSubCaption}>
                  {t("achievements.xpBreakdown", {
                    badgeXp: summary.badgeXp ?? 0,
                    activityXp: summary.activityXp ?? 0,
                  })}
                </Text>
              ) : null}
            </LinearGradient>

            <Text style={styles.sectionTitle}>{t("achievements.badges")}</Text>
            <View style={styles.achGrid}>
              {achievements.map((ach) => {
                const ring = tierRing[ach.tier] || COLORS.border;
                return (
                  <View
                    key={ach.code}
                    style={[styles.achCard, !ach.unlocked && { opacity: 0.45 }]}
                  >
                    <View style={[styles.achIcon, { borderColor: ring, backgroundColor: `${ring}18` }]}>
                      <MaterialCommunityIcons
                        name={iconForKey(ach.iconKey)}
                        size={30}
                        color={ach.unlocked ? ring : COLORS.textMain}
                      />
                    </View>
                    <Text style={styles.achTitle} numberOfLines={2}>
                      {ach.title}
                    </Text>
                    <Text style={styles.achDesc} numberOfLines={3}>
                      {ach.description}
                    </Text>
                    <Text style={styles.achXp}>+{ach.xp} XP</Text>
                    {!ach.unlocked ? (
                      <Ionicons name="lock-closed" size={12} color={COLORS.textMain} style={styles.lock} />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Layout>
  );
};

export default AchievementsPage;
