import en from "@/locales/en.json";
import th from "@/locales/th.json";

export type LanguageCode = "en" | "th";

const translations: Record<LanguageCode, Record<string, string>> = {
  en: en as Record<string, string>,
  th: th as Record<string, string>,
};

export function getStoredLanguage(): LanguageCode {
  const saved = localStorage.getItem("language");
  if (saved === "th" || saved === "en") return saved;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith("th") ? "th" : "en";
}

export function translate(key: string, language: LanguageCode = getStoredLanguage()) {
  return translations[language][key] ?? translations.en[key] ?? "";
}
