/** Collection encyclopedia — read-only derived views of discovered content */

import { PLANETS } from './planets'
import { RECIPES } from './recipes'
import { EMPLOYEES } from './employees'
import type { GameState } from '../logic/game-state'

export interface EncyclopediaStat {
  label: string
  value: string
}

export interface EncyclopediaEntry {
  id: string
  name: string
  description: string
  icon: string
  discovered: boolean
  stats?: EncyclopediaStat[]
  planetId?: string
}

interface CategoryProgress {
  discovered: number
  total: number
  percent: number
}

export interface CollectionProgress {
  planets: CategoryProgress
  recipes: CategoryProgress
  employees: CategoryProgress
  overall: CategoryProgress
}

function catProgress(discovered: number, total: number): CategoryProgress {
  return { discovered, total, percent: total > 0 ? discovered / total : 0 }
}

export function getEncyclopediaPlanets(state: GameState): EncyclopediaEntry[] {
  return PLANETS.map(p => {
    const discovered = state.unlockedPlanets.includes(p.id)
    return {
      id: p.id,
      name: p.name,
      description: discovered ? p.description : '???',
      icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/planets/${p.id}.webp`,
      discovered,
      stats: discovered ? [
        { label: 'Bonus', value: `×${p.specialBonus}` },
        { label: 'Lines', value: String(p.productionLines) },
        { label: 'Recipes', value: String(p.recipes.length) },
      ] : undefined,
    }
  })
}

export function getEncyclopediaRecipes(state: GameState): EncyclopediaEntry[] {
  return RECIPES.map(r => {
    const discovered = state.unlockedRecipes.includes(r.id)
    return {
      id: r.id,
      name: discovered ? r.name : '???',
      description: discovered ? r.name : '???',
      icon: '',
      discovered,
      planetId: r.planetId,
      stats: discovered ? [
        { label: 'Output', value: String(r.baseOutput) },
        { label: 'Price', value: `${r.basePrice}c` },
      ] : undefined,
    }
  })
}

export function getEncyclopediaEmployees(state: GameState): EncyclopediaEntry[] {
  return EMPLOYEES.map(e => {
    const discovered = (state.employees[e.id] ?? 0) > 0
    return {
      id: e.id,
      name: discovered ? e.name : '???',
      description: discovered ? e.description : '???',
      icon: e.icon,
      discovered,
      stats: discovered ? [
        { label: 'Effect', value: e.effect },
        { label: 'Hired', value: String(state.employees[e.id] ?? 0) },
      ] : undefined,
    }
  })
}

export function getCollectionProgress(state: GameState): CollectionProgress {
  const pDisc = PLANETS.filter(p => state.unlockedPlanets.includes(p.id)).length
  const rDisc = RECIPES.filter(r => state.unlockedRecipes.includes(r.id)).length
  const eDisc = EMPLOYEES.filter(e => (state.employees[e.id] ?? 0) > 0).length
  const totalDisc = pDisc + rDisc + eDisc
  const totalAll = PLANETS.length + RECIPES.length + EMPLOYEES.length

  return {
    planets: catProgress(pDisc, PLANETS.length),
    recipes: catProgress(rDisc, RECIPES.length),
    employees: catProgress(eDisc, EMPLOYEES.length),
    overall: catProgress(totalDisc, totalAll),
  }
}
