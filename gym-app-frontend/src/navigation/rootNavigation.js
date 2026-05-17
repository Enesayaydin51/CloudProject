import { StyleSheet } from "react-native";
import React, { useEffect } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import AuthStack from "./AuthStack";
import UserStack from "./UserStack";
import { useSelector, useDispatch } from "react-redux";
import { clearUser, setUser, setUserDetails } from "../redux/userSlice";
import apiService from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { StatusBar } from "expo-status-bar";

function RootNavigation() {
  const { isAuth } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { resolvedMode, colors } = useTheme();

  const navTheme =
    resolvedMode === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: colors.primary,
            background: colors.bg,
            card: colors.white,
            text: colors.textDark,
            border: colors.border,
            notification: colors.secondary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: colors.primary,
            background: colors.bg,
            card: colors.white,
            text: colors.textDark,
            border: colors.border,
            notification: colors.secondary,
          },
        };

  useEffect(() => {
    apiService.setOnUnauthorized(() => dispatch(clearUser()));
  }, [dispatch]);

  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;
    (async () => {
      try {
        const profileRes = await apiService.getProfile();
        if (!cancelled && profileRes?.success && profileRes.data) {
          dispatch(setUser(profileRes.data));
          try {
            const raw = await AsyncStorage.getItem("user");
            const prev = raw ? JSON.parse(raw) : {};
            await AsyncStorage.setItem(
              "user",
              JSON.stringify({ ...prev, ...profileRes.data })
            );
          } catch (_) {
            /* ignore storage merge */
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("Profil özeti yüklenemedi:", e?.message || e);
        }
      }
      if (cancelled) return;
      try {
        const response = await apiService.getUserDetails();
        if (cancelled) return;
        if (response?.success) {
          dispatch(setUserDetails(response.data ?? null));
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("Profil detayları yüklenemedi:", e?.message || e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuth, dispatch]);

  return (
    <>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <NavigationContainer theme={navTheme}>
        {isAuth ? <UserStack /> : <AuthStack initialRouteName="Login" />}
      </NavigationContainer>
    </>
  );
}

export default RootNavigation;

const styles = StyleSheet.create({});
