import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import Layout from "../components/Layout";
import { useTheme } from "../theme/ThemeContext";

const { height } = Dimensions.get("window");

function getDetailCommonStyles(COLORS) {
  return StyleSheet.create({
    shadowLight: {
      ...Platform.select({
        ios: {
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 15,
        },
        android: {
          elevation: 5,
        },
      }),
    },
  });
}

function createExercisesDetailStyles(COLORS) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
    errorBackButton: {
      marginTop: 20,
      backgroundColor: COLORS.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },

    heroContainer: {
      height: height * 0.4,
      width: "100%",
      position: "relative",
      backgroundColor: COLORS.white,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    safeAreaHeader: {
      position: "absolute",
      top: Platform.OS === "ios" ? 20 : 30,
      left: 20,
      zIndex: 10,
    },
    backButtonBlurWrapper: {
      borderRadius: 22,
      overflow: "hidden",
      borderWidth: 1,
    },
    backButtonBlur: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },

    sheetContainer: {
      backgroundColor: COLORS.bg,
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      marginTop: -35,
      paddingHorizontal: 25,
      paddingTop: 15,
      paddingBottom: 20,
      minHeight: height * 0.6,
    },
    dragPill: {
      width: 40,
      height: 5,
      backgroundColor: COLORS.border,
      borderRadius: 3,
      alignSelf: "center",
      marginBottom: 25,
    },

    headerSection: {
      marginBottom: 25,
    },
    exerciseName: {
      color: COLORS.textDark,
      fontSize: 28,
      fontWeight: "900",
      letterSpacing: -0.5,
      marginBottom: 12,
    },
    tagContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    tagBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.primaryLight,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginRight: 10,
    },
    tagText: {
      color: COLORS.primary,
      fontWeight: "800",
      fontSize: 12,
    },
    tagBadgeOutline: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.white,
    },
    tagTextOutline: {
      color: COLORS.textMain,
      fontWeight: "700",
      fontSize: 12,
    },

    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: COLORS.white,
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    statValue: {
      color: COLORS.textDark,
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    statLabel: {
      color: COLORS.textLight,
      fontSize: 11,
      marginTop: 2,
      fontWeight: "700",
    },

    sectionContainer: {
      marginBottom: 30,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    sectionTitle: {
      color: COLORS.textDark,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    descriptionText: {
      color: COLORS.textMain,
      lineHeight: 24,
      fontSize: 14,
      fontWeight: "500",
    },

    noteContainer: {
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 30,
    },
    noteGradient: {
      padding: 20,
    },
    noteTitle: {
      color: COLORS.secondary,
      fontSize: 14,
      fontWeight: "800",
    },
    noteText: {
      color: COLORS.secondary,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: "600",
    },

    fixedFooter: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: COLORS.bg,
      paddingHorizontal: 25,
      paddingTop: 15,
      paddingBottom: Platform.OS === "ios" ? 35 : 20,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    completeButton: {
      borderRadius: 20,
      overflow: "hidden",
    },
    completeButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
    },
    completeButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
  });
}

const ExercisesDetailPage = ({ route, navigation }) => {
  const { exercise } = route.params || {};
  const { colors: C, resolvedMode } = useTheme();
  const isDark = resolvedMode === "dark";

  const COLORS = useMemo(
    () => ({
      bg: C.bg,
      white: C.white,
      textDark: C.textDark,
      textMain: C.textMain,
      textLight: C.textLight,
      border: C.border,
      primary: C.primary,
      primaryDark: C.primaryDark,
      primaryLight: C.primaryLight,
      secondary: C.secondary,
      secondaryLight: C.secondaryLight,
      accent: C.accent,
      accentLight: C.accentLight,
      shadow: C.shadow,
    }),
    [C]
  );

  const styles = useMemo(() => createExercisesDetailStyles(COLORS), [COLORS]);
  const COMMON_STYLES = useMemo(() => getDetailCommonStyles(COLORS), [COLORS]);

  const blurTint = isDark ? "dark" : "light";
  const backBlurBorder = isDark ? "rgba(148,163,184,0.35)" : "rgba(255,255,255,0.8)";
  const backBlurBg = isDark ? "rgba(30,41,59,0.72)" : "rgba(255,255,255,0.7)";

  if (!exercise) {
    return (
      <Layout>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.textLight} style={{ marginBottom: 10 }} />
          <Text style={{ color: COLORS.textDark, fontSize: 16, fontWeight: "600" }}>Egzersiz verisi bulunamadı.</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.errorBackButton}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Geri Dön</Text>
          </Pressable>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.heroContainer}>
            <SafeAreaView style={styles.safeAreaHeader}>
              <Pressable onPress={() => navigation.goBack()} style={[styles.backButtonBlurWrapper, { borderColor: backBlurBorder }]}>
                <BlurView intensity={isDark ? 60 : 80} tint={blurTint} style={[styles.backButtonBlur, { backgroundColor: backBlurBg }]}>
                  <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
                </BlurView>
              </Pressable>
            </SafeAreaView>

            {exercise.gif ? (
              <Image source={exercise.gif} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImage, { backgroundColor: COLORS.border, alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="barbell-outline" size={60} color={COLORS.textLight} />
              </View>
            )}
          </View>

          <View style={[styles.sheetContainer, COMMON_STYLES.shadowLight]}>
            <View style={styles.dragPill} />

            <View style={styles.headerSection}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <View style={styles.tagContainer}>
                <View style={styles.tagBadge}>
                  <Ionicons name="barbell" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.tagText}>{exercise.muscle_group || "Genel"}</Text>
                </View>
                {exercise.level ? (
                  <View style={styles.tagBadgeOutline}>
                    <Ionicons name="speedometer" size={14} color={COLORS.textMain} style={{ marginRight: 4 }} />
                    <Text style={styles.tagTextOutline}>{exercise.level}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="layers" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.statValue}>{exercise.sets || "3-4"}</Text>
                <Text style={styles.statLabel}>SET</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.accentLight }]}>
                  <Ionicons name="repeat" size={18} color={COLORS.accent} />
                </View>
                <Text style={styles.statValue}>{exercise.reps || "8-12"}</Text>
                <Text style={styles.statLabel}>TEKRAR</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.secondaryLight }]}>
                  <Ionicons name="timer" size={18} color={COLORS.secondary} />
                </View>
                <Text style={styles.statValue}>{exercise.rest_time || "60"}</Text>
                <Text style={styles.statLabel}>SANİYE</Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="information" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.sectionTitle}>Nasıl Yapılır?</Text>
              </View>
              <Text style={styles.descriptionText}>
                {exercise.desc ||
                  "Bu egzersiz için detaylı açıklama bulunmamaktadır. Formunuza dikkat ederek görseldeki hareketi uygulayınız."}
              </Text>
            </View>

            {exercise.notes ? (
              <View style={styles.noteContainer}>
                <LinearGradient colors={[COLORS.secondaryLight, COLORS.bg]} style={styles.noteGradient}>
                  <View style={{ flexDirection: "row", marginBottom: 6, alignItems: "center" }}>
                    <Ionicons name="bulb" size={18} color={COLORS.secondary} style={{ marginRight: 6 }} />
                    <Text style={styles.noteTitle}>Eğitmen Notu</Text>
                  </View>
                  <Text style={styles.noteText}>{exercise.notes}</Text>
                </LinearGradient>
              </View>
            ) : (
              <View style={[styles.noteContainer, { borderColor: COLORS.border, borderWidth: 1 }]}>
                <LinearGradient colors={[COLORS.white, COLORS.bg]} style={styles.noteGradient}>
                  <View style={{ flexDirection: "row", marginBottom: 6, alignItems: "center" }}>
                    <Ionicons name="flash" size={18} color={COLORS.textLight} style={{ marginRight: 6 }} />
                    <Text style={[styles.noteTitle, { color: COLORS.textDark }]}>İpucu</Text>
                  </View>
                  <Text style={[styles.noteText, { color: COLORS.textMain }]}>
                    Hareketi yaparken nefes alışverişinizi kontrol etmeyi ve kası hissetmeyi unutmayın.
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.fixedFooter}>
          <Pressable style={styles.completeButton} onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.completeButtonText}>TAMAMLA VE ÇIK</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Layout>
  );
};

export default ExercisesDetailPage;
