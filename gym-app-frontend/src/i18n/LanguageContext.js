import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from "./translations";

const STORAGE_KEY = "@gym_app_language";

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), obj);
}

function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] == null ? "" : String(params[key])
  );
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && translations[raw]) {
          setLanguageState(raw);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback(async (next) => {
    if (!translations[next]) return;
    setLanguageState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key, params) => {
      const value =
        getNestedValue(translations[language], key) ??
        getNestedValue(translations[DEFAULT_LANGUAGE], key) ??
        key;
      return typeof value === "string" ? interpolate(value, params) : key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
