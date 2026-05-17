import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightPalette, darkPalette } from "./palettes";

const STORAGE_KEY = "@gym_app_theme_mode";

const ThemeContext = createContext({
  mode: "light",
  resolvedMode: "light",
  colors: lightPalette,
  setMode: () => {},
  toggleLightDark: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("light");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (raw === "light" || raw === "dark")) {
          setModeState(raw);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(async (next) => {
    if (next !== "light" && next !== "dark") return;
    setModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLightDark = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const resolvedMode = mode === "dark" ? "dark" : "light";
  const colors = useMemo(
    () => (resolvedMode === "dark" ? darkPalette : lightPalette),
    [resolvedMode]
  );

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      colors,
      setMode,
      toggleLightDark,
    }),
    [mode, resolvedMode, colors, setMode, toggleLightDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: "light",
      resolvedMode: "light",
      colors: lightPalette,
      setMode: () => {},
      toggleLightDark: () => {},
    };
  }
  return ctx;
}
