/**
 * Idle Garden Tycoon — i18n tests (RED phase)
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { translations, getLocale, t, type Locale } from '../../src/games/idle-garden/i18n/translations'

describe('i18n', () => {
  describe('translations', () => {
    it('has all required locales', () => {
      expect(translations).toHaveProperty('en')
      expect(translations).toHaveProperty('pt')
      expect(translations).toHaveProperty('es')
      expect(translations).toHaveProperty('id')
      expect(translations).toHaveProperty('tr')
      expect(translations).toHaveProperty('ru')
    })

    it('every locale has the same keys as en', () => {
      const enKeys = Object.keys(translations.en).sort()
      for (const locale of Object.keys(translations) as Locale[]) {
        expect(Object.keys(translations[locale]).sort()).toEqual(enKeys)
      }
    })

    it('has core keys', () => {
      const core = ['play', 'gameOver', 'score', 'coins', 'plant', 'harvest', 'shop', 'prestige', 'settings']
      for (const key of core) {
        expect(translations.en).toHaveProperty(key)
      }
    })
  })

  describe('getLocale', () => {
    it('returns en for English', () => {
      expect(getLocale('en-US')).toBe('en')
      expect(getLocale('en')).toBe('en')
    })

    it('returns pt for Portuguese', () => {
      expect(getLocale('pt-BR')).toBe('pt')
      expect(getLocale('pt')).toBe('pt')
    })

    it('returns es for Spanish', () => {
      expect(getLocale('es-MX')).toBe('es')
    })

    it('returns id for Indonesian', () => {
      expect(getLocale('id')).toBe('id')
    })

    it('returns tr for Turkish', () => {
      expect(getLocale('tr')).toBe('tr')
    })

    it('returns ru for Russian', () => {
      expect(getLocale('ru')).toBe('ru')
    })

    it('falls back to en for unknown locale', () => {
      expect(getLocale('fr-FR')).toBe('en')
      expect(getLocale('ja')).toBe('en')
    })

    it('falls back to en for undefined', () => {
      expect(getLocale(undefined)).toBe('en')
    })
  })

  describe('t helper', () => {
    it('returns translated string for known locale and key', () => {
      const result = t('play', 'pt')
      expect(result).toBe(translations.pt.play)
      expect(result).not.toBe('play') // not returning the key itself
    })

    it('falls back to en for missing locale', () => {
      const result = t('play', 'xx' as Locale)
      expect(result).toBe(translations.en.play)
    })

    it('returns key if even en is missing', () => {
      const result = t('nonexistent_key_xyz' as any, 'en')
      expect(result).toBe('nonexistent_key_xyz')
    })
  })
})
