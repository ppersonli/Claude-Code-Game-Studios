/** Weather system definitions */

export type WeatherType = 'clear' | 'solar_flare' | 'meteor_shower' | 'aurora' | 'blackhole'

export interface Weather {
  type: WeatherType
  nameKey: string
  multiplier: number
  durationSeconds: number
  probability: number
  color: string         // overlay tint
}

export const WEATHERS: Weather[] = [
  { type: 'clear', nameKey: 'weather_clear', multiplier: 1.0, durationSeconds: 0, probability: 0.60, color: 'transparent' },
  { type: 'solar_flare', nameKey: 'weather_solarFlare', multiplier: 1.5, durationSeconds: 30, probability: 0.15, color: 'rgba(255, 152, 0, 0.15)' },
  { type: 'meteor_shower', nameKey: 'weather_meteorShower', multiplier: 0.7, durationSeconds: 20, probability: 0.10, color: 'rgba(120, 120, 120, 0.2)' },
  { type: 'aurora', nameKey: 'weather_aurora', multiplier: 2.0, durationSeconds: 15, probability: 0.05, color: 'rgba(0, 230, 118, 0.15)' },
  { type: 'blackhole', nameKey: 'weather_blackhole', multiplier: 3.0, durationSeconds: 0, probability: 0.10, color: 'rgba(100, 0, 150, 0.2)' },
]

export function rollWeather(): Weather {
  const rand = Math.random()
  let cumulative = 0
  for (const w of WEATHERS) {
    cumulative += w.probability
    if (rand < cumulative) return w
  }
  return WEATHERS[0] // clear
}
