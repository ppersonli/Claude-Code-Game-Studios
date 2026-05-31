export interface Recipe {
  id: string
  name: string
  price: number
  time: number
  unlockLevel: number
  type: 'hot' | 'cold'
  color: number
}

export const RECIPES: Record<string, Recipe> = {
  americano: { id: 'americano', name: 'Americano', price: 1, time: 1000, unlockLevel: 1, type: 'hot', color: 0x3e2723 },
  latte: { id: 'latte', name: 'Latte', price: 3, time: 2000, unlockLevel: 5, type: 'hot', color: 0x5d4037 },
  cappuccino: { id: 'cappuccino', name: 'Cappuccino', price: 5, time: 3000, unlockLevel: 10, type: 'hot', color: 0x4e342e },
  mocha: { id: 'mocha', name: 'Mocha', price: 8, time: 4000, unlockLevel: 15, type: 'hot', color: 0x2c1810 },
  caramel_macchiato: { id: 'caramel_macchiato', name: 'Caramel Macchiato', price: 12, time: 5000, unlockLevel: 20, type: 'hot', color: 0x8d6e63 },
  matcha_latte: { id: 'matcha_latte', name: 'Matcha Latte', price: 15, time: 6000, unlockLevel: 25, type: 'hot', color: 0x66bb6a },
  iced_americano: { id: 'iced_americano', name: 'Iced Americano', price: 2, time: 1000, unlockLevel: 99, type: 'cold', color: 0x3e2723 },
  iced_latte: { id: 'iced_latte', name: 'Iced Latte', price: 6, time: 3000, unlockLevel: 99, type: 'cold', color: 0x5d4037 },
  flat_white: { id: 'flat_white', name: 'Flat White', price: 10, time: 4000, unlockLevel: 99, type: 'hot', color: 0x8d6e63 },
  espresso: { id: 'espresso', name: 'Espresso', price: 20, time: 2000, unlockLevel: 99, type: 'hot', color: 0x1b0e07 },
  cold_brew: { id: 'cold_brew', name: 'Cold Brew', price: 25, time: 8000, unlockLevel: 99, type: 'cold', color: 0x2c1810 },
  pour_over: { id: 'pour_over', name: 'Pour Over', price: 30, time: 10000, unlockLevel: 99, type: 'hot', color: 0x4e342e },
}
