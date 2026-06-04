import { ref, computed } from 'vue'
import { translations, type Locale } from './translations'

const SUPPORTED_LOCALES: Locale[] = ['en', 'pt', 'es', 'id', 'tr', 'ru']

function detectLocale(): Locale {
  const lang = navigator.language.slice(0, 2).toLowerCase()
  if (SUPPORTED_LOCALES.includes(lang as Locale)) return lang as Locale
  return 'en'
}

const locale = ref<Locale>(detectLocale())

export function useI18n() {
  const t = (key: string): string => {
    return translations[locale.value]?.[key] ?? translations.en[key] ?? key
  }

  const setLocale = (newLocale: Locale) => {
    locale.value = newLocale
  }

  return {
    t,
    locale: computed(() => locale.value),
    setLocale,
    SUPPORTED_LOCALES,
  }
}
