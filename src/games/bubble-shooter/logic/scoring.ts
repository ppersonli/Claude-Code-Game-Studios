export function calculateShotScore(popped: number, fallen: number): number {
  return popped * 10 + fallen * 15
}

export function calculateLevelBonus(score: number, shotsLeft: number, maxShots: number): number {
  const shotBonus = Math.floor(shotsLeft * 5)
  const scoreBonus = Math.floor(score * 0.1)
  return shotBonus + scoreBonus
}
