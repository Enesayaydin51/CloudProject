import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// -- Mevcut importların --
import WaterWeeklyCard from "../components/WaterWeeklyCard";
import {
  addWaterMl,
  getGoalMl,
  getTodayMl,
  getWeekStatus,
  getStreak,
  resetToday,
  setGoalMl as setGoalMlStorage,
} from "../storage/waterStorage";
import Layout from "../components/Layout";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

const { width } = Dimensions.get("window");

function getHomeCommonStyles(COLORS) {
  return StyleSheet.create({
    shadowLight: {
      ...Platform.select({
        ios: {
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 15,
        },
        android: {
          elevation: 3,
        },
      }),
    },
  });
}

const HomePage = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createHomePageStyles(COLORS), [COLORS]);
  const COMMON_STYLES = useMemo(() => getHomeCommonStyles(COLORS), [COLORS]);

  const { user, userDetails } = useSelector((state) => state.user);
  const userId = user?.id ?? user?.email ?? null;

  const [name, setName] = useState("");
  const [waterLoading, setWaterLoading] = useState(true);
  const [waterGoal, setWaterGoalState] = useState(2500);
  const [todayMl, setTodayMl] = useState(0);
  const [week, setWeek] = useState(null);
  const [streak, setStreakState] = useState(0);

  const refreshWater = useCallback(async () => {
    if (!userId) {
      setWaterLoading(false);
      return;
    }
    setWaterLoading(true);
    try {
      const [g, t, w, s] = await Promise.all([
        getGoalMl(userId),
        getTodayMl(userId),
        getWeekStatus(userId),
        getStreak(userId),
      ]);
      setWaterGoalState(g);
      setTodayMl(t);
      setWeek(w);
      setStreakState(s);
    } finally {
      setWaterLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refreshWater();
    }, [refreshWater])
  );

  const addWater = async (ml) => {
    if (!userId) return;
    const next = await addWaterMl(ml, userId);
    setTodayMl(next);
    const [w, s] = await Promise.all([getWeekStatus(userId), getStreak(userId)]);
    setWeek(w);
    setStreakState(s);
  };

  const resetWater = async () => {
    if (!userId) return;
    await resetToday(userId);
    setTodayMl(0);
    const [w, s] = await Promise.all([getWeekStatus(userId), getStreak(userId)]);
    setWeek(w);
    setStreakState(s);
  };

  const saveWaterGoal = async (ml) => {
    if (!userId) return 2500;
    const g = await setGoalMlStorage(ml, userId);
    setWaterGoalState(g);
    const [w, s] = await Promise.all([getWeekStatus(userId), getStreak(userId)]);
    setWeek(w);
    setStreakState(s);
  };

  const progress = waterGoal > 0 ? Math.min(1, todayMl / waterGoal) : 0;

  const goalMl = waterGoal;
  const add = addWater;
  const reset = resetWater;
  const setGoalMl = saveWaterGoal;

  useEffect(() => {
    if (user?.firstName) setName(user.firstName);
    else setName(user?.email?.split("@")[0] || t("home.athlete"));
  }, [user, t]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return t("home.night");
    if (hour < 12) return t("home.morning");
    if (hour < 18) return t("home.day");
    return t("home.evening");
  };

  const h = userDetails?.height != null ? Number(userDetails.height) : NaN;
  const w = userDetails?.weight != null ? Number(userDetails.weight) : NaN;
  const hasBodyStatsRegistered =
    userDetails != null && Number.isFinite(h) && h > 0 && Number.isFinite(w) && w > 0;

  const getGoalSummary = () => {
    const goalMap = {
      "Kilo Alma": t("goals.gainWeight"),
      "Kilo Verme": t("goals.loseWeight"),
      "Kilo Koruma": t("goals.maintainWeight"),
      "Kas Geliştirme": t("goals.buildMuscle"),
    };
    const label = goalMap[userDetails?.goal] || userDetails?.goal;
    return label ? label.split(" ")[0] : t("common.select");
  };

  return (
    <Layout>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>{name}!</Text>
              <Text style={styles.subText}>{t("home.subtitle")}</Text>
            </View>

            <Pressable
              onPress={() => navigation.navigate("Profile")}
              style={[styles.profileBtn, COMMON_STYLES.shadowLight]}
            >
              <Text style={styles.profileInitial}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </Pressable>
          </View>

          {/* --- HERO / VÜCUT DURUMU --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.currentStatus")}</Text>
          </View>

          <View style={[styles.heroCard, COMMON_STYLES.shadowLight]}>
            {hasBodyStatsRegistered ? (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: COLORS.primaryLight }]}>
                    <MaterialCommunityIcons name="human-male-height" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statValue}>{userDetails?.height || "--"}</Text>
                  <Text style={styles.statLabel}>{t("home.height")}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: COLORS.secondaryLight }]}>
                    <MaterialCommunityIcons name="weight-kilogram" size={20} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.statValue}>{userDetails?.weight || "--"}</Text>
                  <Text style={styles.statLabel}>{t("home.weight")}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: COLORS.accentLight }]}>
                    <Ionicons name="flag" size={18} color={COLORS.accent} />
                  </View>
                  <Text numberOfLines={1} style={styles.statValueSmall}>
                    {getGoalSummary()}
                  </Text>
                  <Text style={styles.statLabel}>{t("home.goal")}</Text>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => navigation.navigate("Profile")}
                style={({ pressed }) => [styles.profileEmptyWrap, pressed && { opacity: 0.92 }]}
              >
                <View style={[styles.profileEmptyIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="person-outline" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.profileEmptyTitle}>{t("home.noStatsTitle")}</Text>
                <Text style={styles.profileEmptyHint}>
                  {t("home.noStatsHint")}
                </Text>
                <View style={styles.profileEmptyCta}>
                  <Text style={styles.profileEmptyCtaText}>{t("home.openProfile")}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </View>
              </Pressable>
            )}
          </View>

          {/* --- WATER TRACKING --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.water")}</Text>
            <View style={styles.sectionBadge}>
                <Ionicons name="water" size={12} color={COLORS.secondary} style={{marginRight: 4}}/>
                <Text style={styles.sectionBadgeText}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>

          <View style={styles.block}>
            <View style={[styles.waterCardWrapper, COMMON_STYLES.shadowLight]}>
                <WaterWeeklyCard
                  goalMl={goalMl}
                  todayMl={todayMl}
                  progress={progress}
                  week={week}
                  streak={streak}
                  onAdd={add}
                  onReset={reset}
                  onSetGoal={setGoalMl}
                  loading={waterLoading}
                />
            </View>
          </View>

          {/* --- QUICK ACTIONS --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.quickAccess")}</Text>
          </View>

          <View style={styles.quickGrid}>
            <Pressable
              style={[styles.quickCardHalf, COMMON_STYLES.shadowLight]}
              onPress={() => navigation.navigate("Exercises")}
            >
              <View style={[styles.quickIcon, { backgroundColor: COLORS.accentLight }]}>
                <Ionicons name="barbell" size={22} color={COLORS.accent} />
              </View>
              <Text style={styles.quickTitle}>{t("home.myProgram")}</Text>
              <Text style={styles.quickSubtitle}>{t("home.exerciseList")}</Text>
              <View style={styles.quickArrowWrap}>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.textLight} />
              </View>
            </Pressable>

            <Pressable
              style={[styles.quickCardHalf, COMMON_STYLES.shadowLight]}
              onPress={() => navigation.navigate("Diet")}
            >
              <View style={[styles.quickIcon, { backgroundColor: COLORS.secondaryLight }]}>
                <MaterialCommunityIcons name="food-apple" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.quickTitle}>{t("home.dietPlan")}</Text>
              <Text style={styles.quickSubtitle}>{t("home.macroTracking")}</Text>
              <View style={styles.quickArrowWrap}>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.textLight} />
              </View>
            </Pressable>
          </View>

          {/* --- MINI MOTIVATION --- */}
          <View style={styles.noteCard}>
            <LinearGradient
                colors={[COLORS.secondaryLight, COLORS.white]} 
                start={{x:0, y:0}} end={{x:1, y:0}}
                style={styles.noteGradient}
            >
                <View style={[styles.noteIcon, COMMON_STYLES.shadowLight]}>
                  <Ionicons name="leaf" size={16} color={COLORS.secondary} />
                </View>
                <Text style={styles.noteText}>
                  {t("home.motivation")}
                </Text>
            </LinearGradient>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
};

function createHomePageStyles(COLORS) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 120 : 130, // Yüzen TabBar için geniş boşluk
  },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingVertical: 5,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: -2,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 14,
    color: COLORS.textMain,
    marginTop: 2,
    fontWeight: '500',
  },
  profileBtn: {
    width: 50,
    height: 50,
    borderRadius: 25, 
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileInitial: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: "800",
  },

  // SECTION GENERAL
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.3,
  },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.secondary,
  },

  // BODY STATUS (HERO)
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: COLORS.border,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  profileEmptyWrap: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  profileEmptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  profileEmptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 6,
    textAlign: "center",
  },
  profileEmptyHint: {
    fontSize: 13,
    color: COLORS.textMain,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 12,
    fontWeight: "500",
  },
  profileEmptyCta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 4,
  },
  profileEmptyCtaText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },

  // WATER KAPSAYICI
  block: {
    marginBottom: 25,
  },
  waterCardWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // QUICK ACTIONS GRID
  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  quickCardHalf: {
    width: (width - 55) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  quickSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  quickArrowWrap: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MOTIVATION NOTE
  noteCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '600',
  },

  });
}

export default HomePage;