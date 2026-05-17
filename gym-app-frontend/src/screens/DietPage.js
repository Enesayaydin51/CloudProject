import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Animated // Animated API eklendi
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; 
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystemLegacy from "expo-file-system/legacy";

import Layout from "../components/Layout";
import apiService from "../services/api";
import { normalizeNutritionPlan, updateMealLineQuantity } from "../utils/nutritionPlanUtils";
import { showNotificationsIfNewlyUnlocked } from "../utils/achievementNotifications";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { setUserDetails } from "../redux/userSlice";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

const { width } = Dimensions.get("window");

// --- ANIMASYON HESAPLAMALARI ---
const TAB_CONTAINER_WIDTH = width - 40;
const TAB_WIDTH = TAB_CONTAINER_WIDTH / 3;

const MAX_PLATE_IMAGE_SIZE_MB = 8;
const MAX_PLATE_IMAGE_SIZE_BYTES = MAX_PLATE_IMAGE_SIZE_MB * 1024 * 1024;

function getDietCommonStyles(COLORS) {
  return StyleSheet.create({
    shadowLight: {
      ...Platform.select({
        ios: {
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    shadowPremium: {
      ...Platform.select({
        ios: {
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
      }),
    },
  });
}

function MealLineEditor({ item, dayKey, mealIndex, itemIndex, setPlan, bulletColor, styles }) {
  const isStr = typeof item === "string";
  const name = isStr ? item : item?.name ?? "";
  const unit = !isStr && item?.unit ? String(item.unit) : "";
  const calories =
    !isStr && item?.calories != null ? Math.max(0, Math.round(Number(item.calories))) : null;
  const qty = !isStr && item?.quantity != null ? item.quantity : 1;

  const [qtyText, setQtyText] = useState(() => String(qty));
  useEffect(() => {
    setQtyText(String(qty));
  }, [qty, name]);

  if (isStr) {
    return (
      <View style={styles.aiMealBulletRow}>
        <Ionicons name="ellipse" size={5} color={bulletColor} style={{ marginRight: 8, marginTop: 6 }} />
        <Text style={styles.planMealFood}>{item}</Text>
      </View>
    );
  }

  return (
    <View style={styles.aiMealBulletRow}>
      <Ionicons name="ellipse" size={5} color={bulletColor} style={{ marginRight: 8, marginTop: 6 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.planMealFood}>{name}</Text>
        <View style={styles.mealItemEditRow}>
          <Text style={styles.mealItemMiniLabel}>Miktar</Text>
          <TextInput
            style={styles.mealQtyInput}
            value={qtyText}
            keyboardType="decimal-pad"
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9.,]/g, "");
              setQtyText(cleaned);
              const q = parseFloat(String(cleaned).replace(",", "."));
              if (Number.isFinite(q) && q >= 0) {
                setPlan((prev) => {
                  if (!prev) return prev;
                  return updateMealLineQuantity(prev, dayKey, mealIndex, itemIndex, cleaned);
                });
              }
            }}
            onBlur={() => {
              const q = parseFloat(String(qtyText).replace(",", "."));
              if (!Number.isFinite(q) || q < 0) {
                setQtyText(String(qty));
              }
            }}
          />
          {unit ? <Text style={styles.mealItemUnit}>{unit}</Text> : null}
          <Text style={styles.mealItemKcal}>{calories != null ? `${calories} kcal` : "—"}</Text>
        </View>
      </View>
    </View>
  );
}

const DietPage = () => {
  const { colors: themeColors } = useTheme();
  const { t } = useLanguage();
  const COLORS = useMemo(
    () => ({
      bg: themeColors.dietBg,
      white: themeColors.white,
      textDark: themeColors.dietTextDark,
      textMain: themeColors.dietTextMain,
      textLight: themeColors.dietTextLight,
      border: themeColors.dietBorder,
      primary: themeColors.dietPrimary,
      primaryDark: themeColors.dietPrimaryDark,
      primaryLight: themeColors.dietPrimaryLight,
      secondary: themeColors.dietSecondary,
      secondaryLight: themeColors.dietSecondaryLight,
      accent: themeColors.dietAccent,
      accentLight: themeColors.dietAccentLight,
      purple: themeColors.dietPurple,
      purpleLight: themeColors.dietPurpleLight,
      redish: themeColors.dietRedish,
      shadow: themeColors.dietShadow,
    }),
    [themeColors]
  );
  const styles = useMemo(() => createDietPageStyles(COLORS), [COLORS]);
  const COMMON_STYLES = useMemo(() => getDietCommonStyles(COLORS), [COLORS]);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { userDetails, user } = useSelector((state) => state.user);
  const isPro = !!(user?.isPro ?? userDetails?.isPro);
  
  const [activeTab, setActiveTab] = useState("Önerilen"); // "Önerilen", "Kendi", "AI"
  const [aiMode, setAiMode] = useState("chat"); 
  
  // 🎬 KAYMA ANİMASYONU STATE'İ
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let toValue = 0;
    if (activeTab === "Kendi") toValue = TAB_WIDTH;
    if (activeTab === "AI") toValue = TAB_WIDTH * 2;

    Animated.spring(slideAnim, {
      toValue,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  // Dinamik kapsül rengi (Hangi sekmedeyse o sayfanın rengini alsın)
  const getIndicatorColor = () => {
    if (activeTab === "Önerilen") return COLORS.primary;
    if (activeTab === "Kendi") return COLORS.secondary;
    if (activeTab === "AI") return COLORS.purple;
    return COLORS.primary;
  };

  const goal = userDetails?.goal || "Kilo Verme"; 

  useEffect(() => {
    const loadUserDetails = async () => {
      if (!userDetails) {
        try {
          const response = await apiService.getUserDetails();
          if (response.success && response.data) {
            dispatch(setUserDetails(response.data));
          }
        } catch (error) {
          console.warn("User details yüklenemedi:", error);
        }
      }
    };
    loadUserDetails();
  }, []);

  // Tabak fotoğrafı analizi
  const [platePortion, setPlatePortion] = useState("orta"); // az | orta | çok
  const [plateLoading, setPlateLoading] = useState(false);
  const [platePreviewUri, setPlatePreviewUri] = useState(null);
  const [plateResult, setPlateResult] = useState(null);
  const [plateError, setPlateError] = useState(null);

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiSelectedDay, setAiSelectedDay] = useState('Pazartesi');

  // Menüm sekmesinde "tam ekran" göstermek için aktif plan datası
  const [menuDetailPlanData, setMenuDetailPlanData] = useState(null);
  // Auto-navigate ile Menüm'e geçerken useEffect'in tekrar yükleme yapmasını engeller
  const skipNextMenuLoadRef = useRef(false);

  // Backend AI plan formatı:
  // { summary: { dailyCalories, protein, carb, fat, recommendations }, week: { Pazartesi: { meals: [...] }, ... } }
  const aiPlanSummary = aiPlan?.summary;
  const aiPlanWeek = aiPlan?.week;
  const AI_WEEK_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  // Kaydedilen haftalık planlar (nutrition_plans tablosu)
  const [savedNutritionPlans, setSavedNutritionPlans] = useState([]);
  const [savedNutritionPlansLoading, setSavedNutritionPlansLoading] = useState(false);
  const [aiSavePlanLoading, setAiSavePlanLoading] = useState(false);
  const [selectedSavedPlanId, setSelectedSavedPlanId] = useState(null);
  /** Öğün kaydı sırasında: `menu-Pazartesi-0` veya `ai-Salı-1` */
  const [mealSaveLoadingKey, setMealSaveLoadingKey] = useState(null);
  const [dietNewPlanName, setDietNewPlanName] = useState("");
  const [dietMenuPlanNameEdit, setDietMenuPlanNameEdit] = useState("");
  const [dietPlanNameSaving, setDietPlanNameSaving] = useState(false);

  const getDefaultNutritionPlanTitle = () =>
    `${goal} - Haftalık Plan (${new Date().toLocaleDateString("tr-TR")})`;

  useEffect(() => {
    if (!selectedSavedPlanId) {
      setDietMenuPlanNameEdit("");
      return;
    }
    const p = savedNutritionPlans.find((x) => x?.id === selectedSavedPlanId);
    if (p) setDietMenuPlanNameEdit(p.planName || "");
  }, [selectedSavedPlanId, savedNutritionPlans]);

  const formatDateTimeTR = (value) => {
    try {
      if (!value) return '-';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleString('tr-TR');
    } catch {
      return '-';
    }
  };

  const normalizePlanData = (planData) => {
    if (!planData) return null;
    if (typeof planData === 'string') {
      try {
        return JSON.parse(planData);
      } catch {
        return null;
      }
    }
    return planData;
  };

  /** Kayıt / API planını besin satırları + kalori yapısına getirir. */
  const normalizeFullNutritionPlan = (raw) => {
    const p = normalizePlanData(raw) ?? (raw && typeof raw === 'object' ? raw : null);
    if (!p?.week) return p;
    return normalizeNutritionPlan(p);
  };

  const selectedSavedPlan = savedNutritionPlans.find((p) => p?.id === selectedSavedPlanId);
  const selectedSavedPlanData =
    normalizePlanData(selectedSavedPlan?.planData) || selectedSavedPlan?.planData || null;
  const selectedSavedPlanSummary = selectedSavedPlanData?.summary;
  const selectedSavedPlanWeek = selectedSavedPlanData?.week;
  const selectedSavedPlanMealsForDay =
    selectedSavedPlanWeek?.[aiSelectedDay]?.meals || [];

  const menuDetailPlanSummary = menuDetailPlanData?.summary;
  const menuDetailPlanWeek = menuDetailPlanData?.week;
  const menuDetailMealsForDay =
    menuDetailPlanWeek?.[aiSelectedDay]?.meals || [];

  const dietPlans = {
    "Kilo Verme": {
      calories: 1800, protein: "150g", carb: "150g", fat: "50g",
      meals: [
        { title: "Kahvaltı", items: ["2 yumurta", "1 dilim tam buğday ekmeği"] },
        { title: "Öğle", items: ["150g tavuk göğsü", "Bol salata"] },
        { title: "Akşam", items: ["200g balık", "Sebze çorbası"] },
      ],
    },
    "Kilo Alma": {
      calories: 2800, protein: "160g", carb: "350g", fat: "90g",
      meals: [
        { title: "Kahvaltı", items: ["3 yumurta", "100g yulaf", "1 muz"] },
        { title: "Öğle", items: ["200g kırmızı et", "1 tabak pilav"] },
        { title: "Akşam", items: ["200g tavuk", "1 porsiyon makarna"] },
      ],
    },
    "Kilo Koruma": {
      calories: 2200, protein: "140g", carb: "200g", fat: "70g",
      meals: [
        { title: "Kahvaltı", items: ["2 yumurta", "1 bardak süt"] },
        { title: "Öğle", items: ["150g tavuk", "1 tabak bulgur"] },
        { title: "Akşam", items: ["150g balık", "Sebze çorbası"] },
      ],
    },
  };

  const plan = dietPlans[goal] || dietPlans["Kilo Koruma"];

  const pickPlatePhotoAndAnalyze = async () => {
    if (!isPro) {
      Alert.alert(
        "Pro üyelik gerekli",
        "Tabak fotoğrafı ile besin analizi yalnızca Pro üyeler içindir. Profilden Pro’ya yükseltebilirsiniz (100 ₺/ay, şu an demo).",
        [
          { text: "İptal", style: "cancel" },
          { text: "Profil", onPress: () => navigation.navigate("Profile") },
        ]
      );
      return;
    }

    setPlateError(null);
    setPlateResult(null);
    setPlatePreviewUri(null);
    setPlateLoading(true);

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin gerekli", "Kamera izni vermeniz gerekiyor.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.75,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const uri = result.assets[0].uri;
      setPlatePreviewUri(uri);

      let fileSize = 0;
      try {
        const info = await FileSystemLegacy.getInfoAsync(uri, { size: true });
        fileSize = info?.size ?? 0;
      } catch (_) {}

      if (fileSize > MAX_PLATE_IMAGE_SIZE_BYTES) {
        Alert.alert(
          "Resim çok büyük",
          `Bellek hatası olmaması için en fazla ${MAX_PLATE_IMAGE_SIZE_MB} MB fotoğraf seçin.`
        );
        return;
      }

      // base64 üret (çalışmayan ortamlar için fallback var)
      let imageBase64;
      try {
        const file = new File(uri);
        imageBase64 = await file.base64();
      } catch (_) {
        imageBase64 = await FileSystemLegacy.readAsStringAsync(uri, {
          encoding: FileSystemLegacy.EncodingType?.Base64 ?? "base64",
        });
      }

      const lower = uri.toLowerCase();
      const mimeType = lower.endsWith(".png") ? "image/png" : "image/jpeg";

      const res = await apiService.analyzePlatePhoto(imageBase64, mimeType, platePortion);
      if (res?.success && res?.data) {
        setPlateResult(res.data);
      } else {
        setPlateError(res?.message || "Tabak analizi alınamadı.");
      }
    } catch (e) {
      setPlateError(e?.message || "Tabak analizi sırasında hata oluştu.");
    } finally {
      setPlateLoading(false);
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) {
      Alert.alert("Hata", "Lütfen bir soru girin");
      return;
    }
    setAiError("");
    setAiLoading(true);
    try {
      const response = await apiService.askNutritionQuestion(aiQuestion);
      if (response.success) {
        const answerText = String(response?.data?.answer || "").trim();
        setAiAnswer(answerText);
        setAiQuestion("");
        setAiError("");
        if (!answerText) {
          setAiError("Asistan boş yanıt döndürdü. Lütfen tekrar deneyin.");
        }
      } else {
        const message = response.message || "Bir hata oluştu";
        setAiError(message);
        Alert.alert("Hata", message);
      }
    } catch (error) {
      console.error("AI Error:", error);
      const message = error?.message || "AI servisine ulaşılamadı.";
      setAiError(message);
      Alert.alert("Hata", message);
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIPlan = async () => {
    setAiPlanLoading(true);
    try {
      let currentUserDetails = userDetails;
      if (!currentUserDetails) {
         try {
             const resp = await apiService.getUserDetails();
             if(resp.success) currentUserDetails = resp.data;
         } catch(e) {}
      }

      const hasRequiredInfo = currentUserDetails && (currentUserDetails.goal || currentUserDetails.height || currentUserDetails.weight);
      if (!hasRequiredInfo) {
        Alert.alert("Eksik Bilgi", "Lütfen profilinizi güncelleyin.");
        setAiPlanLoading(false);
        return;
      }

      Alert.alert(t("aiPreparation.dietTitle"), t("aiPreparation.dietMessage"), [
        { text: t("aiPreparation.ok") },
      ]);

      const response = await apiService.generateAIPlan();
      if (response.success) {
        // API: { success: true, data: { summary, week } }
        // UI/kayıt: { summary, week }
        const planData = response.data?.data ?? response.data;
        const shapedPlan = normalizeFullNutritionPlan(planData);
        setAiPlan(shapedPlan);
        setAiSelectedDay('Pazartesi');

        // İstediğin akış: oluştur -> direkt kaydet -> Menüm'de tam sayfa göster
        const planName = dietNewPlanName.trim() || getDefaultNutritionPlanTitle();
        const saveResp = await apiService.saveNutritionPlan(shapedPlan ?? planData, planName);

        if (saveResp?.success) {
          const savedId = saveResp.data?.id ?? saveResp.id ?? null;
          setDietNewPlanName("");
          const savedTitle = saveResp.data?.planName || planName;
          setDietMenuPlanNameEdit(savedTitle);
          setSelectedSavedPlanId(savedId);
          setMenuDetailPlanData(
            normalizeFullNutritionPlan(saveResp.data?.planData) || shapedPlan || planData
          );
          showNotificationsIfNewlyUnlocked(saveResp);

          // Önce menü datasını yükle, sonra sekmeye geç.
          // Böylece Menüm useEffect'in ekstra reload'u ile seçilen plan karışmaz.
          await loadSavedNutritionPlans(savedId);
          skipNextMenuLoadRef.current = true;
          setActiveTab('Önerilen');
        } else {
          Alert.alert('Hata', saveResp?.message || 'Plan kaydedilemedi.');
        }
      } else {
        Alert.alert("Hata", response.message || "Plan oluşturulamadı");
      }
    } catch (error) {
      if (error.code === 'PRO_REQUIRED') {
        Alert.alert(
          "Pro üyelik gerekli",
          error.userMessage || "Bu özelliği daha fazla kullanmak için Pro plana geçmelisiniz.",
          [
            { text: "İptal", style: "cancel" },
            { text: "Profil", onPress: () => navigation.navigate("Profile") }
          ]
        );
      } else {
        const msg =
          error?.message ||
          "Bağlantı hatası. Aynı Wi‑Fi’de olduğunuzdan ve backend’in çalıştığından emin olun.";
        Alert.alert("Plan oluşturulamadı", msg);
      }
    } finally {
      setAiPlanLoading(false);
    }
  };

  const loadSavedNutritionPlans = async (preferredPlanId) => {
    setSavedNutritionPlansLoading(true);
    try {
      const resp = await apiService.getNutritionPlans(20, 0);
      if (resp?.success && Array.isArray(resp.data)) {
        const plans = resp.data;
        setSavedNutritionPlans(plans);

        const matchPlanId = (a, b) =>
          a != null && b != null && String(a) === String(b);

        if (plans.length > 0) {
          // Argüman verilmediyse: mevcut seçim hâlâ listede mi bak (silme sonrası vb.)
          const targetId =
            preferredPlanId !== undefined ? preferredPlanId : selectedSavedPlanId;

          const pickedPlan =
            targetId != null
              ? plans.find((p) => matchPlanId(p.id, targetId)) ?? plans[0]
              : plans[0];

          setSelectedSavedPlanId(pickedPlan.id);
          setAiSelectedDay('Pazartesi');
          const pickedPlanData = normalizeFullNutritionPlan(pickedPlan?.planData);
          setMenuDetailPlanData(pickedPlanData);
        } else {
          setSelectedSavedPlanId(null);
          setMenuDetailPlanData(null);
        }
      } else {
        setSavedNutritionPlans([]);
        setSelectedSavedPlanId(null);
        setMenuDetailPlanData(null);
      }
    } catch (e) {
      console.warn('Kayıtlı beslenme planları yüklenemedi:', e?.message || e);
      setSavedNutritionPlans([]);
      setSelectedSavedPlanId(null);
      setMenuDetailPlanData(null);
    } finally {
      setSavedNutritionPlansLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Önerilen') {
      if (skipNextMenuLoadRef.current) {
        skipNextMenuLoadRef.current = false;
        return;
      }
      loadSavedNutritionPlans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const saveDietMenuPlanNameOnly = async () => {
    if (!selectedSavedPlanId || !menuDetailPlanData) return;
    const name = dietMenuPlanNameEdit.trim();
    if (!name) {
      Alert.alert("Plan adı", "Lütfen bir isim girin.");
      return;
    }
    setDietPlanNameSaving(true);
    try {
      const resp = await apiService.updateNutritionPlan(selectedSavedPlanId, menuDetailPlanData, name);
      if (resp?.success) {
        await loadSavedNutritionPlans(selectedSavedPlanId);
        Alert.alert("Kaydedildi", "Plan adı güncellendi.");
      } else {
        Alert.alert("Hata", resp?.message || "Ad güncellenemedi.");
      }
    } catch (e) {
      Alert.alert("Hata", e?.message || "Ad güncellenemedi.");
    } finally {
      setDietPlanNameSaving(false);
    }
  };

  const handleSaveWeeklyPlan = async () => {
    if (!aiPlan) return;
    setAiSavePlanLoading(true);
    try {
      const planName = dietNewPlanName.trim() || getDefaultNutritionPlanTitle();
      const resp = await apiService.saveNutritionPlan(aiPlan, planName);
      if (resp?.success) {
        setDietNewPlanName("");
        showNotificationsIfNewlyUnlocked(resp);
        Alert.alert('Kaydedildi', 'Haftalık beslenme planın kaydedildi.');
        await loadSavedNutritionPlans(resp.data?.id ?? null);
      } else {
        Alert.alert('Hata', resp?.message || 'Plan kaydedilemedi.');
      }
    } catch (e) {
      Alert.alert('Hata', e?.message || 'Plan kaydedilemedi.');
    } finally {
      setAiSavePlanLoading(false);
    }
  };

  /**
   * Bir öğündeki miktar/kalori değişikliklerini sunucuya yazar (tüm haftalık plan JSON güncellenir).
   * @param {'menu'|'ai'} source
   */
  const handleSaveMealDraft = async (source, dayKey, mealIndex) => {
    const plan = source === "menu" ? menuDetailPlanData : aiPlan;
    const mealTitle = plan?.week?.[dayKey]?.meals?.[mealIndex]?.title || "Öğün";
    if (!plan?.week?.[dayKey]?.meals?.[mealIndex]) {
      Alert.alert("Hata", "Öğün bulunamadı.");
      return;
    }
    const loadingKey = `${source}-${dayKey}-${mealIndex}`;
    setMealSaveLoadingKey(loadingKey);
    try {
      const planName =
        (source === "menu" && dietMenuPlanNameEdit?.trim()) ||
        selectedSavedPlan?.planName ||
        getDefaultNutritionPlanTitle();
      const planId = selectedSavedPlanId;

      const applyNormalized = (rawPlan) => {
        const normalized = normalizeFullNutritionPlan(rawPlan) ?? plan;
        setMenuDetailPlanData(normalized);
        setAiPlan(normalized);
      };

      if (planId) {
        const resp = await apiService.updateNutritionPlan(planId, plan, planName);
        if (resp?.success) {
          showNotificationsIfNewlyUnlocked(resp);
          const fromServer = normalizePlanData(resp.data?.planData) ?? resp.data?.planData;
          applyNormalized(fromServer || plan);
          await loadSavedNutritionPlans(planId);
          Alert.alert("Kaydedildi", `"${mealTitle}" öğünü güncellendi.`);
        } else {
          Alert.alert("Hata", resp?.message || "Kaydedilemedi.");
        }
      } else {
        const resp = await apiService.saveNutritionPlan(plan, planName);
        if (resp?.success) {
          showNotificationsIfNewlyUnlocked(resp);
          const newId = resp.data?.id;
          const fromServer = normalizePlanData(resp.data?.planData) ?? resp.data?.planData;
          if (newId) setSelectedSavedPlanId(newId);
          applyNormalized(fromServer || plan);
          await loadSavedNutritionPlans(newId);
          Alert.alert("Kaydedildi", `"${mealTitle}" kaydedildi; plan oluşturuldu.`);
        } else {
          Alert.alert("Hata", resp?.message || "Kaydedilemedi.");
        }
      }
    } catch (e) {
      Alert.alert("Hata", e?.message || "Bağlantı hatası.");
    } finally {
      setMealSaveLoadingKey(null);
    }
  };

  const handleDeleteWeeklyPlan = async (planId) => {
    if (!planId) return;
    Alert.alert(
      'Silme Onayı',
      'Bu haftalık plan silinsin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const resp = await apiService.deleteNutritionPlan(planId);
              if (resp?.success) {
                Alert.alert('Silindi', 'Plan silindi.');
              }
              await loadSavedNutritionPlans();
            } catch (e) {
              Alert.alert('Hata', e?.message || 'Plan silinemedi.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const TAB_ITEMS = [
      { id: "Önerilen", icon: "restaurant", title: "Menüm" },
      { id: "Kendi", icon: "create", title: "Giriş" },
      { id: "AI", icon: "hardware-chip", title: "AI" },
  ];

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          
          {/* ÜST BAŞLIK */}
          <View style={styles.topBar}>
              <View style={styles.topBarTextWrap}>
                  <Text style={styles.pageTitle}>Beslenme Planı</Text>
                  <Text style={styles.subTitle}>Hedefine giden yolda bugünkü menün.</Text>
              </View>
              <View style={[styles.topBarIcon, COMMON_STYLES.shadowLight]}>
                  <Ionicons name="nutrition" size={26} color={COLORS.primary} />
              </View>
          </View>

          {/* 🚀 ANİMASYONLU KAYAN SEKME (TOP TAB) */}
          <View style={styles.tabWrap}>
            <View style={[styles.tabContainer, COMMON_STYLES.shadowLight]}>
              
              {/* 🟦 KAYAN KAPSÜL */}
              <Animated.View style={[
                  styles.slidingIndicator, 
                  { 
                    width: TAB_WIDTH - 12, // Kenar boşlukları düşülmüş genişlik
                    transform: [{ translateX: slideAnim }],
                    backgroundColor: getIndicatorColor()
                  }
              ]} />

              {TAB_ITEMS.map((t) => {
                 const isActive = activeTab === t.id;
                 return (
                  <Pressable key={t.id} style={styles.tabButton} onPress={() => setActiveTab(t.id)}>
                      <View style={styles.tabPill}>
                          <Ionicons name={t.icon} size={16} color={isActive ? COLORS.white : COLORS.textLight} style={{marginBottom: 2}} />
                          <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                              {t.title}
                          </Text>
                      </View>
                  </Pressable>
                 )
              })}
            </View>
          </View>

          {/* DİNAMİK İÇERİK ALANI */}
          <View style={styles.contentArea}>

            {/* 🥗 1. TAB: ÖNERİLEN PLANLAR */}
            {activeTab === "Önerilen" && (
              <View style={styles.tabContentFlex}>
                {menuDetailPlanData ? (
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}
                  >
                    <View style={[styles.summaryCard, COMMON_STYLES.shadowLight]}>
                      <View style={styles.summaryHeader}>
                        <View style={styles.summaryTitleWrap}>
                          <Text style={styles.summaryTitle}>Günlük İhtiyacın</Text>
                          <Text style={styles.summaryGoal}>{goal}</Text>
                        </View>
                        <View style={[styles.iconBox, { backgroundColor: COLORS.accentLight }]}>
                          <Ionicons name="flame" size={24} color={COLORS.accent} />
                        </View>
                      </View>

                      <View style={styles.macroGrid}>
                        <View style={[styles.macroItem, { backgroundColor: COLORS.bg }]}>
                          <Text style={[styles.macroValue, { color: COLORS.accent }]}>{menuDetailPlanSummary?.dailyCalories ?? "-"}</Text>
                          <Text style={styles.macroLabel}>Kalori</Text>
                        </View>
                        <View style={[styles.macroItem, { backgroundColor: COLORS.bg }]}>
                          <Text style={[styles.macroValue, { color: COLORS.primary }]}>{menuDetailPlanSummary?.protein ?? "-"}</Text>
                          <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={[styles.macroItem, { backgroundColor: COLORS.bg }]}>
                          <Text style={[styles.macroValue, { color: COLORS.purple }]}>{menuDetailPlanSummary?.carb ?? "-"}</Text>
                          <Text style={styles.macroLabel}>Karb</Text>
                        </View>
                        <View style={[styles.macroItem, { backgroundColor: COLORS.bg }]}>
                          <Text style={[styles.macroValue, { color: COLORS.secondary }]}>{menuDetailPlanSummary?.fat ?? "-"}</Text>
                          <Text style={styles.macroLabel}>Yağ</Text>
                        </View>
                      </View>
                    </View>

                    {selectedSavedPlanId ? (
                      <View style={[styles.dietPlanNameCard, COMMON_STYLES.shadowLight]}>
                        <Text style={styles.aiInputLabel}>Plan adı</Text>
                        <View style={styles.dietPlanNameRow}>
                          <TextInput
                            style={styles.dietPlanNameInput}
                            value={dietMenuPlanNameEdit}
                            onChangeText={setDietMenuPlanNameEdit}
                            placeholder="Örn: Yaz kesim menüm"
                            placeholderTextColor={COLORS.textLight}
                            maxLength={120}
                          />
                          <Pressable
                            style={[styles.dietPlanNameSaveBtn, dietPlanNameSaving && { opacity: 0.75 }]}
                            onPress={saveDietMenuPlanNameOnly}
                            disabled={dietPlanNameSaving}
                          >
                            {dietPlanNameSaving ? (
                              <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                              <Text style={styles.dietPlanNameSaveBtnText}>Kaydet</Text>
                            )}
                          </Pressable>
                        </View>
                      </View>
                    ) : null}

                    {savedNutritionPlans.length > 1 ? (
                      <View style={{ marginBottom: 14 }}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Kayıtlı Menüler</Text>
                        </View>

                        {savedNutritionPlans.map((p) => {
                          const isActive = p.id === selectedSavedPlanId;
                          return (
                            <View
                              key={p.id}
                              style={[
                                styles.savedPlanCard,
                                isActive && { borderColor: COLORS.purple, backgroundColor: 'rgba(159,122,233,0.06)' },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.savedPlanName}>{p.planName || 'Haftalık Plan'}</Text>
                                <Text style={styles.savedPlanDate}>{formatDateTimeTR(p.createdAt)}</Text>
                              </View>

                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Pressable
                                  style={styles.savedPlanBtn}
                                  onPress={() => {
                                    setSelectedSavedPlanId(p.id);
                                    setAiSelectedDay('Pazartesi');
                                    setMenuDetailPlanData(normalizeFullNutritionPlan(p.planData));
                                  }}
                                >
                                  <Text style={styles.savedPlanBtnText}>İncele</Text>
                                </Pressable>

                                <Pressable
                                  style={[
                                    styles.savedPlanBtn,
                                    { borderColor: COLORS.redish, backgroundColor: 'rgba(252,129,129,0.10)' },
                                  ]}
                                  onPress={() => handleDeleteWeeklyPlan(p.id)}
                                >
                                  <Text style={[styles.savedPlanBtnText, { color: COLORS.redish }]}>Sil</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    {menuDetailPlanSummary?.recommendations ? (
                      <View style={styles.planRecommendationsBox}>
                        <Text style={styles.planRecommendationsTitle}>Öneriler</Text>
                        <Text style={styles.planRecommendationsText}>{menuDetailPlanSummary.recommendations}</Text>
                      </View>
                    ) : null}

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 10 }}
                      contentContainerStyle={{ gap: 10 }}
                    >
                      {AI_WEEK_DAYS.map((day) => (
                        <Pressable
                          key={day}
                          onPress={() => setAiSelectedDay(day)}
                          style={[
                            styles.aiDayPill,
                            day === aiSelectedDay && styles.aiDayPillActive,
                          ]}
                        >
                          <Text style={[styles.aiDayPillText, day === aiSelectedDay && styles.aiDayPillTextActive]}>
                            {day.substring(0, 3).toUpperCase()}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    <View style={styles.weekDaySection}>
                      <Text style={styles.weekDayTitle}>{aiSelectedDay}</Text>
                      {menuDetailMealsForDay.length > 0 ? (
                        menuDetailMealsForDay.map((meal, index) => (
                          <View key={`${aiSelectedDay}-${index}`} style={styles.planMealItem}>
                            <View style={styles.planMealTitleRow}>
                              <Text style={styles.planMealTitle}>{meal.title}</Text>
                              {meal.calories != null && meal.calories !== '' ? (
                                <Text style={styles.mealCaloriesBadge}>{Number(meal.calories)} kcal</Text>
                              ) : null}
                            </View>
                            {(meal.items || []).map((it, k) => (
                              <MealLineEditor
                                key={`${aiSelectedDay}-${index}-${k}`}
                                item={it}
                                dayKey={aiSelectedDay}
                                mealIndex={index}
                                itemIndex={k}
                                setPlan={setMenuDetailPlanData}
                                bulletColor={COLORS.purple}
                                styles={styles}
                              />
                            ))}
                            <Pressable
                              style={[
                                styles.mealSaveBtn,
                                mealSaveLoadingKey === `menu-${aiSelectedDay}-${index}` && { opacity: 0.75 },
                              ]}
                              onPress={() => handleSaveMealDraft("menu", aiSelectedDay, index)}
                              disabled={!!mealSaveLoadingKey}
                            >
                              {mealSaveLoadingKey === `menu-${aiSelectedDay}-${index}` ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                              ) : (
                                <>
                                  <Ionicons name="save-outline" size={18} color={COLORS.white} />
                                  <Text style={styles.mealSaveBtnText}>Öğünü Kaydet</Text>
                                </>
                              )}
                            </Pressable>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.weekDayEmpty}>Öğün bulunamadı.</Text>
                      )}
                    </View>
                    {selectedSavedPlanId ? (
                      <Pressable
                        style={[
                          styles.savedPlanBtn,
                          {
                            borderColor: COLORS.redish,
                            backgroundColor: 'rgba(252,129,129,0.10)',
                            marginTop: 18,
                          },
                        ]}
                        onPress={() => handleDeleteWeeklyPlan(selectedSavedPlanId)}
                      >
                        <Text style={[styles.savedPlanBtnText, { color: COLORS.redish }]}>Sil</Text>
                      </Pressable>
                    ) : null}
                  </ScrollView>
                ) : (
                  <>
                    <View style={[styles.summaryCard, COMMON_STYLES.shadowLight]}>
                      <View style={styles.summaryHeader}>
                        <View style={styles.summaryTitleWrap}>
                          <Text style={styles.summaryTitle}>Günlük İhtiyacın</Text>
                          <Text style={styles.summaryGoal}>{goal}</Text>
                        </View>
                        <View style={[styles.iconBox, { backgroundColor: COLORS.accentLight }]}>
                          <Ionicons name="flame" size={24} color={COLORS.accent} />
                        </View>
                      </View>

                      <View style={styles.macroGrid}>
                        <View style={[styles.macroItem, { backgroundColor: COLORS.bg }]}>
                          <Text style={[styles.macroValue, { color: COLORS.accent }]}>{plan.calories}</Text>
                          <Text style={styles.macroLabel}>Kalori</Text>
                        </View>
                        <View style={[styles.macroItem, { backgroundColor: COLORS.bg }]}>
                          <Text style={[styles.macroValue, { color: COLORS.primary }]}>{plan.protein}</Text>
                          <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={[styles.macroItem, { backgroundColor: COLORS.bg }]}>
                          <Text style={[styles.macroValue, { color: COLORS.purple }]}>{plan.carb}</Text>
                          <Text style={styles.macroLabel}>Karb</Text>
                        </View>
                        <View style={[styles.macroItem, { backgroundColor: COLORS.bg }]}>
                          <Text style={[styles.macroValue, { color: COLORS.secondary }]}>{plan.fat}</Text>
                          <Text style={styles.macroLabel}>Yağ</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Örnek Menü</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalMeals}>
                      {plan.meals.map((m, i) => (
                        <View key={i} style={[styles.mealCardHorizontal, COMMON_STYLES.shadowLight]}>
                          <LinearGradient
                            colors={i === 0 ? ["#FFF7F2", COLORS.white] : i === 1 ? ["#F4FAFF", COLORS.white] : ["#F4F1FF", COLORS.white]}
                            style={styles.mealCardGradient}
                          >
                            <View style={styles.mealHeader}>
                              <View style={[styles.mealIconWrap, { backgroundColor: i === 0 ? COLORS.accentLight : i === 1 ? COLORS.primaryLight : COLORS.purpleLight }]}>
                                <Ionicons
                                  name={i === 0 ? "sunny" : i === 1 ? "partly-sunny" : "moon"}
                                  size={20}
                                  color={i === 0 ? COLORS.accent : i === 1 ? COLORS.primary : COLORS.purple}
                                />
                              </View>
                              <Text style={styles.mealTitle}>{m.title}</Text>
                            </View>
                            <View style={styles.mealContent}>
                              {m.items.map((it, idx) => (
                                <View key={idx} style={styles.mealItemRow}>
                                  <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} style={{ marginRight: 8, marginTop: 2 }} />
                                  <Text style={styles.mealItemText}>{it}</Text>
                                </View>
                              ))}
                            </View>
                          </LinearGradient>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            )}

            {/* 📝 2. TAB: KENDİ — sadece tabak fotoğrafı analizi */}
            {activeTab === "Kendi" && (
              <ScrollView
                style={styles.tabContentFlex}
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.inputCard, COMMON_STYLES.shadowLight, { marginBottom: 0 }]}>
                  {!isPro ? (
                    <View style={[styles.platePaywall, COMMON_STYLES.shadowPremium]}>
                      <LinearGradient
                        colors={[COLORS.secondaryLight, COLORS.white]}
                        style={styles.platePaywallInner}
                      >
                        <Ionicons name="lock-closed" size={36} color={COLORS.secondary} />
                        <Text style={styles.platePaywallTitle}>Pro özelliği</Text>
                        <Text style={styles.platePaywallText}>
                          Tabak fotoğrafı ile AI besin analizi yalnızca Pro üyeler içindir. Aylık 100 ₺ (şu an demo ödeme).
                        </Text>
                        <Pressable
                          style={styles.platePaywallBtn}
                          onPress={() => navigation.navigate("Profile")}
                        >
                          <Text style={styles.platePaywallBtnText}>Profilden Pro’ya geç</Text>
                          <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                        </Pressable>
                      </LinearGradient>
                    </View>
                  ) : (
                    <View style={[styles.plateAnalyzerBox, { marginBottom: 0 }]}>
                      <View style={styles.plateAnalyzerHeader}>
                        <Ionicons name="camera" size={18} color={COLORS.secondary} style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitleSmall}>Tabak Fotoğrafı Analizi</Text>
                      </View>

                      <Text style={styles.platePortionLabel}>Tabaktaki yemek miktarı</Text>
                      <Text style={styles.platePortionHint}>
                        Fotoğrafı çekmeden önce seç. Tahmin edilen kalori ve besin değerleri buna göre ölçeklenir:{" "}
                        <Text style={styles.platePortionHintStrong}>Az</Text> küçük veya az dolu porsiyon,{" "}
                        <Text style={styles.platePortionHintStrong}>Orta</Text> normal bir tabak,{" "}
                        <Text style={styles.platePortionHintStrong}>Çok</Text> dolu tabak veya büyük porsiyon.
                      </Text>

                      <View style={styles.portionRow}>
                        <Pressable
                          style={[styles.portionPill, platePortion === "az" && styles.portionPillActive]}
                          onPress={() => setPlatePortion("az")}
                        >
                          <Text style={[styles.portionPillText, platePortion === "az" && styles.portionPillTextActive]}>Az</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.portionPill, platePortion === "orta" && styles.portionPillActive]}
                          onPress={() => setPlatePortion("orta")}
                        >
                          <Text style={[styles.portionPillText, platePortion === "orta" && styles.portionPillTextActive]}>Orta</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.portionPill, platePortion === "çok" && styles.portionPillActive]}
                          onPress={() => setPlatePortion("çok")}
                        >
                          <Text style={[styles.portionPillText, platePortion === "çok" && styles.portionPillTextActive]}>Çok</Text>
                        </Pressable>
                      </View>

                      <Pressable
                        style={[styles.plateCaptureButton, plateLoading && { opacity: 0.7 }]}
                        onPress={pickPlatePhotoAndAnalyze}
                        disabled={plateLoading}
                      >
                        {plateLoading ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.plateCaptureButtonText}>Fotoğraf Çek & Analiz Et</Text>
                          </>
                        )}
                      </Pressable>

                      {platePreviewUri ? (
                        <Image source={{ uri: platePreviewUri }} style={styles.platePreview} />
                      ) : null}

                      {plateError ? <Text style={styles.plateErrorText}>{plateError}</Text> : null}

                      {plateResult ? (
                        <View style={styles.plateResultBox}>
                          <Text style={styles.plateResultTitle} numberOfLines={2}>
                            {plateResult.foodLabel || "Tabak Analizi"}
                          </Text>
                          <Text style={styles.plateCalories}>
                            {plateResult?.nutrition?.calories ?? "-"} kcal
                          </Text>

                          <View style={styles.plateMacrosRow}>
                            <Text style={styles.plateMacroLine}>
                              Protein: {plateResult?.nutrition?.macros?.protein_g ?? "-"} g
                            </Text>
                            <Text style={styles.plateMacroLine}>
                              Karb: {plateResult?.nutrition?.macros?.carbs_g ?? "-"} g
                            </Text>
                            <Text style={styles.plateMacroLine}>
                              Yağ: {plateResult?.nutrition?.macros?.fat_g ?? "-"} g
                            </Text>
                          </View>

                          <View style={styles.plateMicrosRow}>
                            <Text style={styles.plateMicroLine}>
                              Lif: {plateResult?.nutrition?.micros?.fiber_g ?? "-"} g
                            </Text>
                            <Text style={styles.plateMicroLine}>
                              Şeker: {plateResult?.nutrition?.micros?.sugar_g ?? "-"} g
                            </Text>
                            <Text style={styles.plateMicroLine}>
                              Sodyum: {plateResult?.nutrition?.micros?.sodium_mg ?? "-"} mg
                            </Text>
                            <Text style={styles.plateMicroLine}>
                              Potasyum: {plateResult?.nutrition?.micros?.potassium_mg ?? "-"} mg
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            {/* 🤖 3. TAB: AI ASİSTAN */}
            {activeTab === "AI" && (
              <ScrollView
                style={styles.tabContentFlex}
                contentContainerStyle={styles.aiTabScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.aiHero, COMMON_STYLES.shadowLight]}>
                    <View style={styles.aiHeroIconWrap}>
                        <Ionicons name="hardware-chip" size={32} color={COLORS.purple} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.aiHeroTitle}>Akıllı Asistan</Text>
                        <Text style={styles.aiHeroSub}>Beslenme uzmanı cebinde.</Text>
                    </View>
                </View>

                <View style={styles.aiSubTabContainer}>
                    <Pressable style={[styles.aiSubTab, aiMode === "chat" && styles.aiSubTabActive]} onPress={() => setAiMode("chat")}>
                        <Ionicons name="chatbubbles" size={18} color={aiMode === "chat" ? COLORS.white : COLORS.purple} style={{marginRight:6}}/>
                        <Text style={[styles.aiSubTabText, aiMode === "chat" && styles.aiSubTabTextActive]}>Soru Sor</Text>
                    </Pressable>
                    <Pressable style={[styles.aiSubTab, aiMode === "plan" && styles.aiSubTabActive]} onPress={() => setAiMode("plan")}>
                        <Ionicons name="clipboard" size={18} color={aiMode === "plan" ? COLORS.white : COLORS.purple} style={{marginRight:6}}/>
                        <Text style={[styles.aiSubTabText, aiMode === "plan" && styles.aiSubTabTextActive]}>Plan Oluştur</Text>
                    </Pressable>
                </View>

                {aiMode === "chat" && (
                    <View style={[styles.aiCard, COMMON_STYLES.shadowLight, {flex: 1}]}>
                      <Text style={styles.aiInputLabel}>Neyi merak ediyorsun?</Text>
                      <TextInput
                        placeholder="Örn: Spordan hemen sonra ne yemeliyim?"
                        placeholderTextColor={COLORS.textLight}
                        value={aiQuestion}
                        onChangeText={setAiQuestion}
                        style={styles.aiInput}
                        multiline
                      />
                      <Pressable style={[styles.aiButtonSmall, aiLoading && {opacity: 0.7}]} onPress={askAI} disabled={aiLoading}>
                        {aiLoading ? <ActivityIndicator color={COLORS.white} size="small"/> : <Text style={styles.aiButtonTextSmall}>Asistana Gönder</Text>}
                      </Pressable>
                      
                      <View style={{ marginTop: 20, minHeight: 150 }}>
                          {aiError ? (
                            <View style={styles.aiErrorContainer}>
                              <View style={styles.aiAnswerTop}>
                                  <Ionicons name="alert-circle" size={16} color={COLORS.redish} style={{marginRight: 6}} />
                                  <Text style={styles.aiErrorLabel}>Cevap Alınamadı</Text>
                              </View>
                              <Text style={styles.aiErrorText}>{aiError}</Text>
                            </View>
                          ) : aiAnswer ? (
                            <View style={styles.aiAnswerContainer}>
                              <View style={styles.aiAnswerTop}>
                                  <Ionicons name="sparkles" size={16} color={COLORS.purple} style={{marginRight: 6}} />
                                  <Text style={styles.aiAnswerLabel}>Asistanın Cevabı</Text>
                              </View>
                              <Text style={styles.aiAnswerText}>{aiAnswer}</Text>
                            </View>
                          ) : (
                              <View style={styles.aiEmptyState}>
                                  <Ionicons name="chatbox-ellipses-outline" size={50} color={COLORS.border} />
                                  <Text style={styles.aiEmptyText}>Sorularını bekliyorum.</Text>
                              </View>
                          )}
                      </View>
                    </View>
                )}

                {aiMode === "plan" && (
                    <View style={[styles.aiCard, COMMON_STYLES.shadowLight, {flex: 1}]}>
                      <Text style={styles.aiInputLabel}>Sana Özel Menü Tasarımı</Text>
                      {userDetails && (
                          <View style={styles.userInfoBadgeWrap}>
                              <View style={styles.userInfoBadge}>
                                  <Text style={styles.userInfoLabel}>Hedef:</Text>
                                  <Text style={styles.userInfoValue}>{userDetails.goal || "-"}</Text>
                              </View>
                              <View style={styles.userInfoBadge}>
                                  <Text style={styles.userInfoLabel}>Kilo:</Text>
                                  <Text style={styles.userInfoValue}>{userDetails.weight}kg</Text>
                              </View>
                          </View>
                      )}

                      <Text style={[styles.aiInputLabel, { marginTop: 4 }]}>Plan adı (isteğe bağlı)</Text>
                      <TextInput
                        style={styles.dietPlanNameInputSingle}
                        value={dietNewPlanName}
                        onChangeText={setDietNewPlanName}
                        placeholder="Boş bırakırsan hedef + tarih ile kaydedilir"
                        placeholderTextColor={COLORS.textLight}
                        maxLength={120}
                      />
                      
                      <Pressable style={[styles.primaryButton, COMMON_STYLES.shadowPremium, aiPlanLoading && {opacity: 0.7}, {marginTop: 10}]} onPress={generateAIPlan} disabled={aiPlanLoading}>
                        {aiPlanLoading ? <ActivityIndicator color={COLORS.white} style={{paddingVertical: 14}}/> : (
                            <LinearGradient colors={[COLORS.purple, "#7364D2"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.primaryButtonGradient}>
                                <Ionicons name="color-wand" size={20} color={COLORS.white} style={{marginRight:8}}/>
                                <Text style={styles.primaryButtonText}>Sihirli Planı Oluştur</Text>
                            </LinearGradient>
                        )}
                      </Pressable>

                      <View style={{ marginTop: 15 }}>
                          {aiPlan ? (
                            <View style={styles.generatedPlanBox}>
                              <View style={styles.planMacroRow}>
                                <View style={styles.planMacroBadge}>
                                  <Text style={styles.planMacroText}>{aiPlanSummary?.dailyCalories ?? "-"} kcal</Text>
                                </View>
                                <View style={styles.planMacroBadge}>
                                  <Text style={styles.planMacroText}>Protein: {aiPlanSummary?.protein ?? "-"}</Text>
                                </View>
                                <View style={styles.planMacroBadge}>
                                  <Text style={styles.planMacroText}>Karbo: {aiPlanSummary?.carb ?? "-"}</Text>
                                </View>
                                <View style={styles.planMacroBadge}>
                                  <Text style={styles.planMacroText}>Yağ: {aiPlanSummary?.fat ?? "-"}</Text>
                                </View>
                              </View>

                              {aiPlanSummary?.recommendations ? (
                                <View style={styles.planRecommendationsBox}>
                                  <Text style={styles.planRecommendationsTitle}>Öneriler</Text>
                                  <Text style={styles.planRecommendationsText}>{aiPlanSummary.recommendations}</Text>
                                </View>
                              ) : null}

                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginBottom: 14 }}
                                contentContainerStyle={{ gap: 10 }}
                              >
                                {AI_WEEK_DAYS.map((day) => (
                                  <Pressable
                                    key={day}
                                    onPress={() => setAiSelectedDay(day)}
                                    style={[
                                      styles.aiDayPill,
                                      day === aiSelectedDay && styles.aiDayPillActive,
                                    ]}
                                  >
                                    <Text style={[styles.aiDayPillText, day === aiSelectedDay && styles.aiDayPillTextActive]}>
                                      {day.substring(0, 3).toUpperCase()}
                                    </Text>
                                  </Pressable>
                                ))}
                              </ScrollView>

                              {(() => {
                                const meals = aiPlanWeek?.[aiSelectedDay]?.meals || [];
                                return (
                                  <View style={styles.weekDaySection}>
                                    <Text style={styles.weekDayTitle}>{aiSelectedDay}</Text>
                                    {meals.length > 0 ? (
                                      meals.map((meal, index) => (
                                        <View key={`${aiSelectedDay}-${index}`} style={styles.planMealItem}>
                                          <View style={styles.planMealTitleRow}>
                                            <Text style={styles.planMealTitle}>{meal.title}</Text>
                                            {meal.calories != null && meal.calories !== '' ? (
                                              <Text style={styles.mealCaloriesBadge}>{Number(meal.calories)} kcal</Text>
                                            ) : null}
                                          </View>
                                          {(meal.items || []).map((it, k) => (
                                            <MealLineEditor
                                              key={`ai-${aiSelectedDay}-${index}-${k}`}
                                              item={it}
                                              dayKey={aiSelectedDay}
                                              mealIndex={index}
                                              itemIndex={k}
                                              setPlan={setAiPlan}
                                              bulletColor={COLORS.purple}
                                              styles={styles}
                                            />
                                          ))}
                                          <Pressable
                                            style={[
                                              styles.mealSaveBtn,
                                              mealSaveLoadingKey === `ai-${aiSelectedDay}-${index}` && {
                                                opacity: 0.75,
                                              },
                                            ]}
                                            onPress={() => handleSaveMealDraft("ai", aiSelectedDay, index)}
                                            disabled={!!mealSaveLoadingKey}
                                          >
                                            {mealSaveLoadingKey === `ai-${aiSelectedDay}-${index}` ? (
                                              <ActivityIndicator size="small" color={COLORS.white} />
                                            ) : (
                                              <>
                                                <Ionicons name="save-outline" size={18} color={COLORS.white} />
                                                <Text style={styles.mealSaveBtnText}>Öğünü Kaydet</Text>
                                              </>
                                            )}
                                          </Pressable>
                                        </View>
                                      ))
                                    ) : (
                                      <Text style={styles.weekDayEmpty}>Öğün bulunamadı.</Text>
                                    )}
                                  </View>
                                );
                              })()}
                            </View>
                          ) : (
                              <View style={styles.aiEmptyState}>
                                  <Ionicons name="document-text-outline" size={50} color={COLORS.border} />
                                  <Text style={styles.aiEmptyText}>Profiline göre menü oluşturmak için butona tıkla.</Text>
                              </View>
                          )}

                          <View style={{ marginTop: 22 }}>
                            <Text style={styles.sectionTitleSmall}>Kayıtlı Planlarım</Text>

                            {savedNutritionPlansLoading ? (
                              <ActivityIndicator color={COLORS.purple} style={{ marginTop: 10 }} />
                            ) : savedNutritionPlans.length === 0 ? (
                              <View style={styles.aiEmptyState}>
                                <Ionicons name="document-text-outline" size={40} color={COLORS.border} />
                                <Text style={styles.aiEmptyText}>Henüz kayıtlı planın yok.</Text>
                              </View>
                            ) : (
                              savedNutritionPlans.map((p) => {
                                const planData = normalizePlanData(p.planData) || p.planData;
                                return (
                                  <View key={p.id} style={styles.savedPlanCard}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.savedPlanName}>{p.planName || 'Haftalık Plan'}</Text>
                                      <Text style={styles.savedPlanDate}>{formatDateTimeTR(p.createdAt)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                      <Pressable
                                        style={styles.savedPlanBtn}
                                        onPress={() => {
                                          if (!planData) return;
                                          setSelectedSavedPlanId(p.id);
                                          setAiSelectedDay("Pazartesi");
                                          setAiPlan(normalizeFullNutritionPlan(planData));
                                        }}
                                      >
                                        <Text style={styles.savedPlanBtnText}>Detay</Text>
                                      </Pressable>
                                      <Pressable
                                        style={[styles.savedPlanBtn, { borderColor: COLORS.redish, backgroundColor: 'rgba(252,129,129,0.10)' }]}
                                        onPress={() => handleDeleteWeeklyPlan(p.id)}
                                      >
                                        <Text style={[styles.savedPlanBtnText, { color: COLORS.redish }]}>Sil</Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                );
                              })
                            )}
                          </View>
                      </View>
                    </View>
                )}
              </ScrollView>
            )}

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Layout>
  );
};

function createDietPageStyles(COLORS) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  topBarTextWrap: { flex: 1 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
  subTitle: { color: COLORS.textMain, fontSize: 14, marginTop: 2 },
  topBarIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },

  // --- ANİMASYONLU TAB PANELİ ---
  tabWrap: { paddingHorizontal: 20, marginBottom: 15 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    bottom: 6,
    borderRadius: 14,
  },
  tabButton: { flex: 1 },
  tabPill: { paddingVertical: 14, borderRadius: 16, alignItems: "center", justifyContent: 'center', zIndex: 1 },
  tabText: { fontSize: 14, fontWeight: "800", color: COLORS.textLight },
  activeTabText: { color: COLORS.white },

  contentArea: { flex: 1, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 90 : 100 },
  tabContentFlex: { flex: 1, display: 'flex', flexDirection: 'column' },
  sectionHeader: { marginBottom: 12, marginTop: 5 },
  sectionTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  sectionTitleSmall: { color: COLORS.textDark, fontSize: 15, fontWeight: "800", marginBottom: 10 },

  summaryCard: { padding: 18, borderRadius: 24, marginBottom: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  summaryTitleWrap: { flex: 1 },
  summaryTitle: { color: COLORS.textLight, fontSize: 12, fontWeight: "700", textTransform: 'uppercase' },
  summaryGoal: { color: COLORS.textDark, fontSize: 20, fontWeight: "800", marginTop: 2, letterSpacing: -0.5 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  macroItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  macroValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  macroLabel: { color: COLORS.textMain, fontSize: 12, marginTop: 4, fontWeight: '700' },

  horizontalMeals: { paddingBottom: 10, gap: 15 },
  mealCardHorizontal: { width: Math.max(260, width - 60), borderRadius: 26, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  mealCardGradient: { flex: 1, padding: 16 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)", paddingBottom: 12 },
  mealIconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  mealTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: "900" },
  mealContent: { paddingTop: 2 },
  mealItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  mealItemText: { color: COLORS.textMain, fontSize: 15, fontWeight: '600', flex: 1, lineHeight: 22 },

  inputCard: { backgroundColor: COLORS.white, padding: 18, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  platePaywall: { borderRadius: 22, overflow: "hidden" },
  platePaywallInner: {
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
  },
  platePaywallTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textDark, marginTop: 12, marginBottom: 8 },
  platePaywallText: { fontSize: 14, color: COLORS.textMain, textAlign: "center", lineHeight: 20, marginBottom: 18 },
  platePaywallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
  },
  platePaywallBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
  plateAnalyzerBox: { backgroundColor: COLORS.bg, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  plateAnalyzerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  platePortionLabel: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  platePortionHint: {
    color: COLORS.textMain,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  platePortionHintStrong: { fontWeight: '800', color: COLORS.secondary },
  portionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  portionPill: { flex: 1, paddingVertical: 10, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  portionPillActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  portionPillText: { color: COLORS.textLight, fontWeight: '900', fontSize: 13 },
  portionPillTextActive: { color: COLORS.white },
  plateCaptureButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.secondary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 10 },
  plateCaptureButtonText: { color: COLORS.white, fontWeight: '900', fontSize: 14 },
  platePreview: { width: '100%', height: 180, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, marginBottom: 10 },
  plateErrorText: { color: COLORS.redish, fontWeight: '800', marginBottom: 10 },
  plateResultBox: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  plateResultTitle: { color: COLORS.textDark, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  plateCalories: { color: COLORS.secondary, fontWeight: '900', fontSize: 22, marginBottom: 8 },
  plateMacrosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  plateMacroLine: { color: COLORS.textMain, fontSize: 12, fontWeight: '700' },
  plateMicrosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  plateMicroLine: { color: COLORS.textLight, fontSize: 12, fontWeight: '700' },
  primaryButton: { borderRadius: 16, overflow: 'hidden' },
  primaryButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  primaryButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },

  aiHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  aiHeroIconWrap: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.purpleLight, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  aiHeroTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: "800", marginBottom: 2 },
  aiHeroSub: { color: COLORS.textMain, fontSize: 12, fontWeight: '500' },
  aiSubTabContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  aiSubTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  aiSubTabActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  aiSubTabText: { color: COLORS.purple, fontSize: 16, fontWeight: '900' },
  aiSubTabTextActive: { color: COLORS.white },
  aiTabScrollContent: { paddingBottom: 120 },
  aiCard: { padding: 20, borderRadius: 24, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  aiInputLabel: { color: COLORS.textDark, fontSize: 15, fontWeight: "800", marginBottom: 12 },
  aiInput: { backgroundColor: COLORS.bg, borderRadius: 16, color: COLORS.textDark, padding: 16, minHeight: 90, textAlignVertical: 'top', marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, fontSize: 14, fontWeight: '500' },
  aiButtonSmall: { backgroundColor: COLORS.purple, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  aiButtonTextSmall: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  aiEmptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5, marginTop: 20 },
  aiEmptyText: { color: COLORS.textMain, fontSize: 13, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  aiAnswerContainer: { backgroundColor: COLORS.purpleLight, padding: 18, borderRadius: 16 },
  aiAnswerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiAnswerLabel: { color: COLORS.purple, fontSize: 13, fontWeight: "800" },
  aiAnswerText: { color: COLORS.textDark, lineHeight: 22, fontSize: 14, fontWeight: '600' },
  aiErrorContainer: { backgroundColor: 'rgba(255, 91, 91, 0.12)', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 91, 91, 0.25)' },
  aiErrorLabel: { color: COLORS.redish, fontSize: 13, fontWeight: '800' },
  aiErrorText: { color: COLORS.textDark, lineHeight: 22, fontSize: 14, fontWeight: '600' },
  userInfoBadgeWrap: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  userInfoBadge: { backgroundColor: COLORS.bg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  userInfoLabel: { color: COLORS.textLight, fontSize: 12, fontWeight: '700', marginRight: 6 },
  userInfoValue: { color: COLORS.textDark, fontSize: 13, fontWeight: '800' },
  generatedPlanBox: { paddingTop: 10 },
  planMacroRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  planMacroBadge: { backgroundColor: COLORS.purpleLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  planMacroText: { color: COLORS.purple, fontWeight: "900", fontSize: 15 },
  planMealItem: { marginBottom: 14, backgroundColor: COLORS.bg, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  planMealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  planMealTitle: { color: COLORS.textDark, fontWeight: "900", fontSize: 17, flex: 1, minWidth: 120 },
  mealCaloriesBadge: {
    color: COLORS.purple,
    fontWeight: '900',
    fontSize: 13,
    backgroundColor: COLORS.purpleLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  aiMealBulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  planMealFood: { color: COLORS.textMain, fontSize: 16, fontWeight: '600', flex: 1, lineHeight: 24 },
  mealItemEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 8,
  },
  mealItemMiniLabel: { color: COLORS.textLight, fontSize: 12, fontWeight: '700' },
  mealQtyInput: {
    minWidth: 44,
    maxWidth: 72,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  mealItemUnit: { color: COLORS.textMain, fontSize: 13, fontWeight: '700' },
  mealItemKcal: { marginLeft: 'auto', color: COLORS.accent, fontSize: 13, fontWeight: '900' },
  mealSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignSelf: 'flex-start',
  },
  mealSaveBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 13 },

  planRecommendationsBox: { backgroundColor: COLORS.purpleLight, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  planRecommendationsTitle: { color: COLORS.purple, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  planRecommendationsText: { color: COLORS.textDark, fontSize: 14, fontWeight: '600', lineHeight: 22 },

  weekDaySection: { marginBottom: 22, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  weekDayTitle: { color: COLORS.textDark, fontWeight: '900', fontSize: 18, marginBottom: 10 },
  weekDayEmpty: { color: COLORS.textMain, fontWeight: '600', marginBottom: 10, opacity: 0.75 },

  dietPlanNameCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
  },
  dietPlanNameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dietPlanNameInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  dietPlanNameInputSingle: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  dietPlanNameSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: COLORS.purple,
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  dietPlanNameSaveBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 13 },
  savedPlanCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginTop: 12 },
  savedPlanName: { color: COLORS.textDark, fontWeight: '900', fontSize: 14 },
  savedPlanDate: { color: COLORS.textLight, fontWeight: '700', fontSize: 12, marginTop: 4 },
  savedPlanBtn: { borderWidth: 1, borderColor: COLORS.purpleLight, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: COLORS.purpleLight },
  savedPlanBtnText: { fontWeight: '900', color: COLORS.purple, fontSize: 15 },

  aiDayPill: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiDayPillActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  aiDayPillText: {
    fontWeight: '900',
    fontSize: 14,
    color: COLORS.textLight,
  },
  aiDayPillTextActive: {
    color: COLORS.white,
  },

  });
}

export default DietPage;