import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  setEmail,
  setPassword,
  setIsLoading,
  setAuth,
  setUser,
  setToken,
} from "../redux/userSlice";
import Layout from "../components/Layout";
import api from "../services/api";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

const { width, height } = Dimensions.get("window");

function createLoginPageStyles(COLORS) {
  return StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: COLORS.bg },
    decorativeCircle: {
      position: "absolute",
      top: -height * 0.1,
      right: -width * 0.2,
      width: width * 0.8,
      height: width * 0.8,
      borderRadius: width * 0.4,
      backgroundColor: COLORS.primaryLight,
    },
    scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
    header: {
      alignItems: "center",
      marginTop: height * 0.05,
      marginBottom: 10,
    },
    logoBox: {
      width: 150,
      height: 150,
      backgroundColor: COLORS.white,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 25,
      elevation: 12,
      marginBottom: 20,
    },
    logo: {
      width: 250,
      height: 250,
      resizeMode: "contain",
    },
    brandName: { fontSize: 28, fontWeight: "900", color: COLORS.textDark, letterSpacing: -1 },
    brandTagline: { fontSize: 13, color: COLORS.textMain, fontWeight: "600", marginTop: 2 },

    formCard: {
      backgroundColor: COLORS.white,
      borderRadius: 32,
      padding: 25,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.05,
      shadowRadius: 30,
      elevation: 5,
    },
    welcomeTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textDark, textAlign: "center" },
    welcomeSub: { fontSize: 14, color: COLORS.textMain, textAlign: "center", marginBottom: 30, marginTop: 5 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: "800", color: COLORS.textMain, marginBottom: 8, marginLeft: 5, letterSpacing: 1 },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.inputBg,
      borderRadius: 16,
      paddingHorizontal: 15,
      height: 58,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: COLORS.textDark, fontSize: 15, fontWeight: "600" },
    forgotPass: { alignSelf: "flex-end", marginTop: 8 },
    forgotPassText: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },

    btnShadow: {
      marginTop: 10,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 8,
    },
    loginBtn: {
      height: 58,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    loginBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800", letterSpacing: 1 },

    footer: { flexDirection: "row", justifyContent: "center", marginTop: 25 },
    footerText: { fontSize: 14, color: COLORS.textMain, fontWeight: "600" },
    signupLink: { fontSize: 14, color: COLORS.primary, fontWeight: "800" },
  });
}

const LoginPage = ({ navigation }) => {
  const { email, password, isLoading } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { colors: C } = useTheme();
  const { t } = useLanguage();

  const COLORS = useMemo(
    () => ({
      bg: C.loginBg,
      white: C.white,
      textDark: C.loginTextDark,
      textMain: C.loginTextMain,
      primary: C.primary,
      primaryDark: C.primaryDark,
      primaryLight: C.primaryLight,
      inputBg: C.surfaceMuted,
      inputBorder: C.loginBorder,
    }),
    [C]
  );
  const styles = useMemo(() => createLoginPageStyles(COLORS), [COLORS]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("auth.missingTitle"), t("auth.missingLoginMessage"));
      return;
    }
    try {
      dispatch(setIsLoading(true));
      const result = await api.login({ email: email.trim(), password });
      dispatch(setUser(result.data.user));
      dispatch(setToken(result.data.token));
      dispatch(setAuth(true));
    } catch (error) {
      Alert.alert(t("common.error"), error?.message || t("auth.loginError"));
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  return (
    <Layout>
      <View style={styles.mainContainer}>
        <View style={styles.decorativeCircle} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <SafeAreaView style={styles.header}>
              <View style={styles.logoBox}>
                <Image style={styles.logo} source={require("../../assets/images/logo.png")} />
              </View>
              <Text style={styles.brandName}>
                GYM<Text style={{ color: COLORS.primary }}>APP</Text>
              </Text>
              <Text style={styles.brandTagline}>{t("auth.tagline")}</Text>
            </SafeAreaView>

            <View style={styles.formCard}>
              <Text style={styles.welcomeTitle}>{t("auth.welcomeTitle")}</Text>
              <Text style={styles.welcomeSub}>{t("auth.welcomeSubtitle")}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("auth.email")}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="mail@adresin.com"
                    placeholderTextColor={COLORS.textMain}
                    onChangeText={(text) => dispatch(setEmail(text))}
                    value={email}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("auth.password")}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMain}
                    secureTextEntry
                    onChangeText={(text) => dispatch(setPassword(text))}
                    value={password}
                  />
                </View>
                <Pressable style={styles.forgotPass}>
                  <Text style={styles.forgotPassText}>{t("auth.forgotPassword")}</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => [styles.btnShadow, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtn}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.loginBtnText}>{t("auth.login")}</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t("auth.noAccount")}</Text>
                <Pressable onPress={() => navigation.navigate("Signup")}>
                  <Text style={styles.signupLink}> {t("auth.signup")}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Layout>
  );
};

export default LoginPage;
