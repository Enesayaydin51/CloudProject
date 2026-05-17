import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";

import Layout from "../components/Layout";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { setUserDetails, setUser, clearUser } from "../redux/userSlice";
import apiService from "../services/api";
import { showNotificationsIfNewlyUnlocked } from "../utils/achievementNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { useLanguage } from "../i18n/LanguageContext";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

/** Profil → API `injuries` string dizisi ile birebir eşleşen etiketler (sıra kullanıcıya gösterim için). */
const ILLNESS_OPTIONS = [
  { key: "belFitigi", value: "Bel Fıtığı" },
  { key: "boyunFitigi", value: "Boyun Fıtığı" },
  { key: "dizSakatligi", value: "Diz Sakatlığı" },
  { key: "omuzSakatligi", value: "Omuz Sakatlığı" },
  { key: "ayakBilegiSakatligi", value: "Ayak Bileği Sakatlığı" },
  { key: "bilekDirsekTendiniti", value: "Bilek / Dirsek Tendiniti" },
  { key: "kalcaSakroiliak", value: "Kalça Ağrısı / Sakroiliak" },
  { key: "meniskusBag", value: "Menisküs / Bağ Yaralanması" },
  { key: "skolyozKifoz", value: "Skolyoz / Kifoz" },
  { key: "osteoporoz", value: "Osteoporoz" },
  { key: "kalpDamarAritmi", value: "Kalp-Damar Hastalığı / Aritmi" },
  { key: "astim", value: "Astım" },
  { key: "yuksekTansiyon", value: "Yüksek Tansiyon" },
  { key: "dusukTansiyon", value: "Düşük Tansiyon" },
  { key: "obezlik", value: "Obezlik" },
  { key: "tip2Diyabet", value: "Tip 2 Diyabet" },
  { key: "tiroidHastaligi", value: "Tiroid Hastalığı" },
  { key: "hamilelikLohusalik", value: "Hamilelik / Lohusalık" },
  { key: "epilepsi", value: "Epilepsi" },
  { key: "kronikBobrekKaraciger", value: "Kronik Böbrek / Karaciğer Hastalığı" },
];

const GOAL_OPTIONS = [
  { value: "Kilo Alma", labelKey: "goals.gainWeight" },
  { value: "Kilo Verme", labelKey: "goals.loseWeight" },
  { value: "Kilo Koruma", labelKey: "goals.maintainWeight" },
  { value: "Kas Geliştirme", labelKey: "goals.buildMuscle" },
];

const GENDER_OPTIONS = [
  { value: "Erkek", labelKey: "gender.male" },
  { value: "Kadın", labelKey: "gender.female" },
  { value: "Diğer", labelKey: "gender.other" },
];

function findOptionLabel(options, value, t) {
  return options.find((item) => item.value === value)?.labelKey
    ? t(options.find((item) => item.value === value).labelKey)
    : value;
}

function buildIllnessStateFromArray(arr) {
  const set = new Set(Array.isArray(arr) ? arr : []);
  return ILLNESS_OPTIONS.reduce((acc, { key, value }) => {
    acc[key] = set.has(value);
    return acc;
  }, {});
}

function getProfileCommonStyles(COLORS) {
  return StyleSheet.create({
    shadowLight: {
      ...Platform.select({
        ios: {
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        android: {
          elevation: 2,
        },
      }),
    },
  });
}

const ProfilePage = ({ navigation }) => {
  const { colors: COLORS, setMode, resolvedMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = useMemo(() => createProfilePageStyles(COLORS), [COLORS]);
  const COMMON_STYLES = useMemo(() => getProfileCommonStyles(COLORS), [COLORS]);

  const dispatch = useDispatch();
  const { user, userDetails } = useSelector((state) => state.user);

  const [illnesses, setIllnesses] = useState(() => buildIllnessStateFromArray([]));

  const [goal, setGoal] = useState("Kilo Alma");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [userData, setUserData] = useState(null);

  const [goalModal, setGoalModal] = useState(false);
  const [illnessModal, setIllnessModal] = useState(false);
  const [genderModal, setGenderModal] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [achievementLevel, setAchievementLevel] = useState(1);

  const loadAchievementSummary = useCallback(async () => {
    try {
      const res = await apiService.getAchievements();
      showNotificationsIfNewlyUnlocked(res);
      const lvl = res?.data?.summary?.level;
      if (res?.success && typeof lvl === "number" && !Number.isNaN(lvl)) {
        setAchievementLevel(lvl);
      }
    } catch {
      /* sessiz */
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (user?.id) loadUserDetails();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadAchievementSummary();
    }, [user?.id, loadAchievementSummary])
  );

  const loadUserData = async () => {
    try {
      if (user) {
        setUserData(user);
        return;
      }
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const parsedUser = JSON.parse(userString);
        setUserData(parsedUser);
      }
    } catch (error) {
      console.error("Kullanıcı bilgileri yüklenirken hata:", error);
    }
  };

  const loadUserDetails = async () => {
    try {
      const response = await apiService.getUserDetails();
      if (response.success && response.data) {
        const d = response.data;
        dispatch(setUserDetails(d));
        const storedRaw = await AsyncStorage.getItem("user");
        const stored = storedRaw ? JSON.parse(storedRaw) : {};
        dispatch(
          setUser({
            ...stored,
            ...user,
            isPro: d.isPro,
            membershipTier: d.membershipTier,
            proExpiresAt: d.proExpiresAt,
          })
        );
        setUserData((prev) => ({
          ...(prev || {}),
          isPro: d.isPro,
          membershipTier: d.membershipTier,
          proExpiresAt: d.proExpiresAt,
        }));
        setHeight(d.height?.toString() || "");
        setWeight(d.weight?.toString() || "");
        setGoal(d.goal || "Kilo Alma");
        setGender(d.gender || "");
        setAge(d.age != null ? String(d.age) : "");

        if (d.injuries != null) {
          setIllnesses(buildIllnessStateFromArray(d.injuries));
        }
      }
    } catch (err) {
      console.error("User details hatası:", err);
    }
  };

  const handleSubscribePro = () => {
    Alert.alert(
      t("profile.proTitle"),
      t("profile.proMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.goPro"),
          onPress: async () => {
            setSubLoading(true);
            try {
              const r = await apiService.subscribePro();
              if (r.success && r.data) {
                dispatch(setUser({ ...(user || {}), ...r.data }));
                setUserData((prev) => ({ ...(prev || {}), ...r.data }));
                await loadUserDetails();
                showNotificationsIfNewlyUnlocked(r);
                Alert.alert(t("common.success"), r.message || t("profile.proActive"));
                loadAchievementSummary();
              } else {
                Alert.alert(t("common.error"), r.message || t("profile.actionFailed"));
              }
            } catch (e) {
              Alert.alert(t("common.error"), e?.message || t("profile.actionFailed"));
            } finally {
              setSubLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelPro = () => {
    Alert.alert(
      t("profile.proCancelTitle"),
      t("profile.proCancelMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.cancelMembership"),
          style: "destructive",
          onPress: async () => {
            setSubLoading(true);
            try {
              const r = await apiService.cancelProSubscription();
              if (r.success && r.data) {
                dispatch(setUser({ ...(user || {}), ...r.data }));
                setUserData((prev) => ({ ...(prev || {}), ...r.data }));
                await loadUserDetails();
                Alert.alert(t("common.success"), r.message || t("profile.proCancelled"));
                loadAchievementSummary();
              } else {
                Alert.alert(t("common.error"), r.message || t("profile.actionFailed"));
              }
            } catch (e) {
              Alert.alert(t("common.error"), e?.message || t("profile.actionFailed"));
            } finally {
              setSubLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatProExpiry = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(language === "en" ? "en-US" : "tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const isProMember = !!(userData?.isPro ?? user?.isPro);

  const toggleIllness = (key) => setIllnesses((prev) => ({ ...prev, [key]: !prev[key] }));

  const getHealthStatus = () => {
    const list = ILLNESS_OPTIONS.filter(({ key }) => illnesses[key]).map(({ key }) =>
      t(`injuries.${key}`)
    );
    return list.length ? list.join(", ") : t("profile.unspecified");
  };

  const getInjuriesArray = () =>
    ILLNESS_OPTIONS.filter(({ key }) => illnesses[key]).map(({ value }) => value);

  const handleSaveProfile = async () => {
    if (!height || !weight) return Alert.alert(t("common.error"), t("profile.heightWeightRequired"));
    setIsLoading(true);
    try {
      const detailsData = {
        height: parseInt(height),
        weight: parseFloat(weight),
        injuries: getInjuriesArray(),
        goal: goal.trim(),
        gender: gender.trim() || undefined,
        age: age.trim() ? parseInt(age, 10) : undefined,
      };
      const response = await apiService.updateUserDetails(detailsData);
      if (response.success) {
        dispatch(setUserDetails(response.data));
        showNotificationsIfNewlyUnlocked(response);
        Alert.alert(t("common.success"), t("profile.profileUpdated"));
        loadAchievementSummary();
      }
    } catch (err) {
      console.error("Profil kaydetme hatası:", err);
      Alert.alert(t("common.error"), t("profile.saveError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("profile.logoutTitle"), t("profile.logoutMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("profile.logout"), style: "destructive", onPress: async () => {
          await apiService.logout();
          dispatch(clearUser());
      }},
    ]);
  };

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("profile.permissionTitle"), t("profile.permissionMessage"));
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.55,
        base64: true,
      });
      if (picked.canceled) return;
      const asset = picked.assets?.[0];
      if (!asset?.base64) {
        Alert.alert(t("common.error"), t("profile.imageReadError"));
        return;
      }
      const mime = asset.mimeType && asset.mimeType.startsWith("image/") ? asset.mimeType : "image/jpeg";
      const dataUrl = `data:${mime};base64,${asset.base64}`;
      setAvatarUploading(true);
      const res = await apiService.updateProfileAvatar({ avatarDataUrl: dataUrl });
      if (res.success && res.data) {
        const merged = { ...(userData || {}), ...res.data };
        setUserData(merged);
        dispatch(setUser(merged));
        await AsyncStorage.setItem("user", JSON.stringify(merged));
        Alert.alert(t("common.success"), t("profile.avatarUpdated"));
      } else {
        Alert.alert(t("common.error"), res.message || t("profile.unexpectedServer"));
      }
    } catch (err) {
      console.error("Avatar yükleme:", err);
      Alert.alert(t("common.error"), err?.message || t("profile.uploadError"));
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <Layout>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* 🔝 ÜST BAR */}
            <View style={styles.topBar}>
                <Text style={styles.pageTitle}>{t("profile.title")}</Text>
                <Pressable style={styles.logoutIconButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.redish} />
                </Pressable>
            </View>

            {/* 👤 PROFİL ALANI */}
            <View style={styles.profileCenterBlock}>
                <Pressable
                  onPress={handlePickAvatar}
                  disabled={avatarUploading}
                  style={({ pressed }) => [{ opacity: pressed || avatarUploading ? 0.85 : 1 }]}
                >
                  <View style={[styles.profileImageWrapper, COMMON_STYLES.shadowLight]}>
                    <Image
                      style={styles.profileImage}
                      source={
                        userData?.avatarDataUrl
                          ? { uri: userData.avatarDataUrl }
                          : require("../../assets/images/profiletabicon.png")
                      }
                    />
                    <View style={styles.editIconBadge}>
                      {avatarUploading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Ionicons name="camera" size={12} color={COLORS.white} />
                      )}
                    </View>
                  </View>
                </Pressable>
                <Text style={styles.nameText} numberOfLines={1}>{userData?.firstName} {userData?.lastName}</Text>
                <Text style={styles.emailText} numberOfLines={1}>{userData?.email}</Text>
                
                <View style={[styles.badgeLight, !isProMember && { backgroundColor: COLORS.bg }]}>
                    <Ionicons
                      name={isProMember ? "star" : "person-outline"}
                      size={10}
                      color={isProMember ? COLORS.primary : COLORS.textLight}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.badgeTextLight, !isProMember && { color: COLORS.textMain }]}>
                      {isProMember ? t("profile.proMember") : t("profile.freeMember")}
                    </Text>
                </View>
                {isProMember && (userData?.proExpiresAt || user?.proExpiresAt) ? (
                  <Text style={styles.proExpiryHint}>
                    {t("profile.proExpires", { date: formatProExpiry(userData?.proExpiresAt || user?.proExpiresAt) })}
                  </Text>
                ) : null}

                {isProMember && (
                  <Pressable
                    style={[styles.cancelProBtn, subLoading && { opacity: 0.7 }]}
                    onPress={handleCancelPro}
                    disabled={subLoading}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={COLORS.redish} style={{ marginRight: 6 }} />
                    <Text style={styles.cancelProBtnText}>{t("profile.cancelPro")}</Text>
                  </Pressable>
                )}

                {/* Üyelik kartı */}
                {!isProMember && (
                  <View style={[styles.membershipCard, COMMON_STYLES.shadowLight]}>
                    <View style={styles.membershipHeader}>
                      <Ionicons name="diamond" size={22} color={COLORS.purple} />
                      <Text style={styles.membershipTitle}>{t("profile.upgradePro")}</Text>
                    </View>
                    <Text style={styles.membershipPrice}>{t("profile.proPrice")}</Text>
                    <Text style={styles.membershipFeat}>{t("profile.proFeature")}</Text>
                    <Pressable
                      style={[styles.membershipBtn, subLoading && { opacity: 0.75 }]}
                      onPress={handleSubscribePro}
                      disabled={subLoading}
                    >
                      {subLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.membershipBtnText}>{t("profile.activatePro")}</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                <View style={[styles.membershipCard, COMMON_STYLES.shadowLight]}>
                  <View style={styles.membershipHeader}>
                    <Ionicons name="contrast-outline" size={22} color={COLORS.purple} />
                    <Text style={styles.membershipTitle}>{t("profile.appearance")}</Text>
                  </View>
                  <Text style={styles.membershipFeat}>{t("profile.appearanceHint")}</Text>
                  <View style={styles.themeRow}>
                    <Pressable
                      style={[styles.themePill, resolvedMode === "light" && styles.themePillActive]}
                      onPress={() => setMode("light")}
                    >
                      <Text style={[styles.themePillText, resolvedMode === "light" && styles.themePillTextActive]}>
                        {t("profile.light")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.themePill, resolvedMode === "dark" && styles.themePillActive]}
                      onPress={() => setMode("dark")}
                    >
                      <Text style={[styles.themePillText, resolvedMode === "dark" && styles.themePillTextActive]}>
                        {t("profile.dark")}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.membershipCard, COMMON_STYLES.shadowLight]}>
                  <View style={styles.membershipHeader}>
                    <Ionicons name="language-outline" size={22} color={COLORS.purple} />
                    <Text style={styles.membershipTitle}>{t("profile.language")}</Text>
                  </View>
                  <Text style={styles.membershipFeat}>{t("profile.languageHint")}</Text>
                  <View style={styles.themeRow}>
                    <Pressable
                      style={[styles.themePill, language === "tr" && styles.themePillActive]}
                      onPress={() => setLanguage("tr")}
                    >
                      <Text style={[styles.themePillText, language === "tr" && styles.themePillTextActive]}>
                        {t("profile.turkish")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.themePill, language === "en" && styles.themePillActive]}
                      onPress={() => setLanguage("en")}
                    >
                      <Text style={[styles.themePillText, language === "en" && styles.themePillTextActive]}>
                        {t("profile.english")}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* 🎖️ GELİŞİM KARTI (TIKLANABİLİR) */}
                <Pressable 
                    style={({pressed}) => [styles.progressPreviewCard, COMMON_STYLES.shadowLight, {opacity: pressed ? 0.9 : 1}]}
                    onPress={() => navigation.navigate("AchievementsPage")}
                >
                    <LinearGradient colors={[COLORS.primary, COLORS.purple]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.progressGradient}>
                        <View style={styles.progressLeft}>
                            <View style={styles.miniLevelBadge}>
                                <Text style={styles.miniLevelText}>{achievementLevel}</Text>
                            </View>
                            <View>
                                <Text style={styles.progressTitle}>{t("profile.progressLevel")}</Text>
                                <Text style={styles.progressSub}>{t("profile.progressSub")}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
                    </LinearGradient>
                </Pressable>
            </View>

            {/* 🎛️ 3'LÜ FİZİKSEL BİLGİ SATIRI */}
            <View style={styles.metricsRow}>
                <View style={[styles.metricCard, COMMON_STYLES.shadowLight]}>
                    <View style={[styles.metricIconWrap, {backgroundColor: COLORS.primaryLight}]}>
                        <MaterialCommunityIcons name="human-male-height" size={18} color={COLORS.primary} />
                    </View>
                    <TextInput
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="number-pad"
                      style={styles.metricInput}
                      placeholder="180"
                      maxLength={3}
                    />
                    <Text style={styles.metricLabel}>{t("profile.height")}</Text>
                </View>

                <View style={[styles.metricCard, COMMON_STYLES.shadowLight]}>
                    <View style={[styles.metricIconWrap, {backgroundColor: COLORS.secondaryLight}]}>
                        <MaterialCommunityIcons name="weight-kilogram" size={18} color={COLORS.secondary} />
                    </View>
                    <TextInput
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="decimal-pad"
                      style={[styles.metricInput, styles.metricInputWide]}
                      placeholder="80"
                      maxLength={6}
                    />
                    <Text style={styles.metricLabel}>{t("profile.weight")}</Text>
                </View>

                <View style={[styles.metricCard, COMMON_STYLES.shadowLight]}>
                    <View style={[styles.metricIconWrap, {backgroundColor: COLORS.purpleLight}]}>
                        <Ionicons name="calendar" size={16} color={COLORS.purple} />
                    </View>
                    <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={styles.metricInput} placeholder="25" maxLength={3} />
                    <Text style={styles.metricLabel}>{t("profile.age")}</Text>
                </View>
            </View>

            {/* 📋 AYARLAR LİSTESİ */}
            <View style={styles.settingsHeaderWrap}>
                <Text style={styles.sectionTitle}>{t("profile.personalDetails")}</Text>
            </View>
            <View style={[styles.settingsBlock, COMMON_STYLES.shadowLight]}>
                <Pressable style={styles.settingRow} onPress={() => setGenderModal(true)}>
                    <View style={styles.settingLeft}>
                        <View style={[styles.settingIcon, {backgroundColor: COLORS.bg}]}><Ionicons name="person" size={14} color={COLORS.textMain} /></View>
                        <Text style={styles.settingLabel}>{t("profile.gender")}</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.settingValue}>{gender ? findOptionLabel(GENDER_OPTIONS, gender, t) : t("common.select")}</Text>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />
                    </View>
                </Pressable>

                <View style={styles.settingDivider} />

                <Pressable style={styles.settingRow} onPress={() => setGoalModal(true)}>
                    <View style={styles.settingLeft}>
                        <View style={[styles.settingIcon, {backgroundColor: COLORS.accentLight}]}><Ionicons name="flag" size={14} color={COLORS.accent} /></View>
                        <Text style={styles.settingLabel}>{t("profile.goal")}</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.settingValue} numberOfLines={1}>{findOptionLabel(GOAL_OPTIONS, goal, t)}</Text>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />
                    </View>
                </Pressable>

                <View style={styles.settingDivider} />

                <Pressable style={styles.settingRow} onPress={() => setIllnessModal(true)}>
                    <View style={styles.settingLeft}>
                        <View style={[styles.settingIcon, {backgroundColor: COLORS.redishLight}]}><Ionicons name="medkit" size={14} color={COLORS.redish} /></View>
                        <Text style={styles.settingLabel}>{t("profile.injuries")}</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.settingValue} numberOfLines={1}>{getHealthStatus()}</Text>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />
                    </View>
                </Pressable>
            </View>

            <View style={styles.bottomAction}>
                <Pressable style={[styles.primaryButton, isLoading && {opacity: 0.7}]} onPress={handleSaveProfile} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color={COLORS.white} /> : (
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.primaryButtonGradient}>
                            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                            <Text style={styles.primaryButtonText}>{t("profile.saveChanges")}</Text>
                        </LinearGradient>
                    )}
                </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* MODALLAR */}
      <Modal visible={goalModal} transparent animationType="fade">
          <BlurView intensity={20} tint="light" style={styles.modalOverlay}>
            <View style={[styles.modalContent, COMMON_STYLES.shadowLight]}>
                <Text style={styles.modalTitle}>{t("profile.selectGoal")}</Text>
                {GOAL_OPTIONS.map((item) => (
                    <Pressable key={item.value} style={[styles.modalOption, goal === item.value && styles.modalOptionSelected]} onPress={() => { setGoal(item.value); setGoalModal(false); }}>
                        <Text style={[styles.modalOptionText, goal === item.value && {color: COLORS.primaryDark}]}>{t(item.labelKey)}</Text>
                        {goal === item.value && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                    </Pressable>
                ))}
                <Pressable style={styles.modalCancel} onPress={() => setGoalModal(false)}>
                    <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
                </Pressable>
            </View>
          </BlurView>
      </Modal>

      <Modal visible={genderModal} transparent animationType="fade">
          <BlurView intensity={20} tint="light" style={styles.modalOverlay}>
            <View style={[styles.modalContent, COMMON_STYLES.shadowLight]}>
                <Text style={styles.modalTitle}>{t("profile.selectGender")}</Text>
                {GENDER_OPTIONS.map((item) => (
                    <Pressable key={item.value} style={[styles.modalOption, gender === item.value && styles.modalOptionSelected]} onPress={() => { setGender(item.value); setGenderModal(false); }}>
                        <Text style={[styles.modalOptionText, gender === item.value && {color: COLORS.primaryDark}]}>{t(item.labelKey)}</Text>
                        {gender === item.value && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                    </Pressable>
                ))}
                <Pressable style={styles.modalCancel} onPress={() => setGenderModal(false)}>
                    <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
                </Pressable>
            </View>
          </BlurView>
      </Modal>

      <Modal visible={illnessModal} transparent animationType="fade">
          <BlurView intensity={20} tint="light" style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.modalContentIllness, COMMON_STYLES.shadowLight]}>
                <Text style={styles.modalTitle}>{t("profile.healthStatus")}</Text>
                <Text style={styles.modalSubtitle}>{t("profile.healthSubtitle")}</Text>
                <ScrollView
                  style={styles.illnessModalScroll}
                  contentContainerStyle={styles.illnessModalScrollContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {ILLNESS_OPTIONS.map((item) => {
                    const isSelected = illnesses[item.key];
                    return (
                        <Pressable key={item.key} style={[styles.modalOption, isSelected && styles.modalOptionSelectedSecondary]} onPress={() => toggleIllness(item.key)}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={22} color={isSelected ? COLORS.secondary : COLORS.textLight} style={{ marginRight: 10 }} />
                                <Text style={[styles.modalOptionText, isSelected && { color: COLORS.textDark }]}>{t(`injuries.${item.key}`)}</Text>
                            </View>
                        </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable style={styles.primaryButtonModal} onPress={() => setIllnessModal(false)}>
                    <Text style={styles.primaryButtonTextModal}>{t("common.done")}</Text>
                </Pressable>
            </View>
          </BlurView>
      </Modal>

    </Layout>
  );
};

function createProfilePageStyles(COLORS) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 120 : 130,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
  logoutIconButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.redishLight, alignItems: 'center', justifyContent: 'center' },
  
  profileCenterBlock: { alignItems: 'center' },
  profileImageWrapper: { position: 'relative', marginBottom: 10, padding: 4, backgroundColor: COLORS.white, borderRadius: 40 },
  profileImage: { width: 76, height: 76, borderRadius: 38 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  nameText: { color: COLORS.textDark, fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginBottom: 2 },
  emailText: { color: COLORS.textMain, fontSize: 12, marginBottom: 8, fontWeight: '500' },
  badgeLight: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: COLORS.primaryLight, marginBottom: 8 },
  badgeTextLight: { color: COLORS.primary, fontSize: 10, fontWeight: "800" },
  proExpiryHint: { fontSize: 11, color: COLORS.textLight, marginBottom: 12, fontWeight: '600' },
  cancelProBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.redish,
    backgroundColor: COLORS.redishLight,
    width: "100%",
  },
  cancelProBtnText: { color: COLORS.redish, fontWeight: "800", fontSize: 13 },
  themeRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  themePill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  themePillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  themePillText: { fontWeight: "700", color: COLORS.textMain, fontSize: 13 },
  themePillTextActive: { color: COLORS.primary, fontWeight: "800" },
  membershipCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  membershipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  membershipTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  membershipPrice: { fontSize: 22, fontWeight: '900', color: COLORS.purple, marginBottom: 8 },
  membershipFeat: { fontSize: 13, color: COLORS.textMain, marginBottom: 14, lineHeight: 18 },
  membershipBtn: {
    backgroundColor: COLORS.purple,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  membershipBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  // GELİŞİM KARTI
  progressPreviewCard: { width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 5 },
  progressGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  progressLeft: { flexDirection: 'row', alignItems: 'center' },
  miniLevelBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  miniLevelText: { color: COLORS.white, fontWeight: '900', fontSize: 14 },
  progressTitle: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  progressSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'stretch' },
  metricCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  metricInput: {
    width: '100%',
    minWidth: 56,
    alignSelf: 'stretch',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  metricInputWide: { minWidth: 72 },
  metricLabel: { fontSize: 11, color: COLORS.textMain, fontWeight: '600' },
  
  settingsHeaderWrap: { marginTop: 5 },
  sectionTitle: { color: COLORS.textMain, fontSize: 13, fontWeight: "700", textTransform: 'uppercase' },
  settingsBlock: { backgroundColor: COLORS.white, borderRadius: 20, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingLabel: { fontSize: 14, color: COLORS.textDark, fontWeight: '600' },
  settingRight: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  settingValue: { fontSize: 13, color: COLORS.textMain, fontWeight: '500', marginRight: 6 },
  settingDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 56, marginRight: 16 },
  
  bottomAction: { width: '100%' },
  primaryButton: { borderRadius: 16, overflow: 'hidden' },
  primaryButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  primaryButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(45, 55, 72, 0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: COLORS.white, borderRadius: 28, padding: 25 },
  modalContentIllness: { maxHeight: WINDOW_HEIGHT * 0.88 },
  illnessModalScroll: { maxHeight: Math.min(460, WINDOW_HEIGHT * 0.55) },
  illnessModalScrollContent: { paddingBottom: 6 },
  modalTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 15 },
  modalSubtitle: { color: COLORS.textMain, textAlign: "center", marginBottom: 15, fontSize: 12 },
  modalOption: { backgroundColor: COLORS.bg, padding: 14, borderRadius: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOptionSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  modalOptionSelectedSecondary: { backgroundColor: COLORS.secondaryLight },
  modalOptionText: { color: COLORS.textDark, fontSize: 14, fontWeight: "700" },
  primaryButtonModal: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  primaryButtonTextModal: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  modalCancel: { marginTop: 12, alignItems: 'center', padding: 10 },
  modalCancelText: { color: COLORS.textLight, fontWeight: "700", fontSize: 13 }
  });
}

export default ProfilePage;