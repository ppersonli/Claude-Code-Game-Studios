export interface SortLevel {
  id: number
  name: string
  tubes: number
  ingredientTypes: number
  itemsPerType: number
  targetMoves: number
  targetTime: number
  requiredStars: number
}

export const SORT_LEVELS: SortLevel[] = [
  { id: 1, name: '初學者', tubes: 4, ingredientTypes: 3, itemsPerType: 4, targetMoves: 15, targetTime: 120, requiredStars: 0 },
  { id: 2, name: '小試牛刀', tubes: 5, ingredientTypes: 4, itemsPerType: 4, targetMoves: 25, targetTime: 150, requiredStars: 2 },
  { id: 3, name: '進階玩家', tubes: 5, ingredientTypes: 4, itemsPerType: 4, targetMoves: 28, targetTime: 160, requiredStars: 5 },
  { id: 4, name: '珍珠達人', tubes: 6, ingredientTypes: 5, itemsPerType: 4, targetMoves: 35, targetTime: 180, requiredStars: 8 },
  { id: 5, name: '奶茶大師', tubes: 7, ingredientTypes: 6, itemsPerType: 4, targetMoves: 50, targetTime: 240, requiredStars: 12 },
  { id: 6, name: '傳說級', tubes: 8, ingredientTypes: 7, itemsPerType: 4, targetMoves: 70, targetTime: 300, requiredStars: 16 },
]
