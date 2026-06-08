import type { Clothing, ClothingCategory } from '../data/types'

const EQUIPPABLE_CATEGORIES: ClothingCategory[] = ['top', 'bottom', 'shoes', 'accessory', 'hair']

export class DressUpSystem {
  private equipped = new Map<ClothingCategory, Clothing>()

  equip(clothing: Clothing): void {
    this.equipped.set(clothing.category, clothing)
  }

  unequip(category: ClothingCategory): void {
    this.equipped.delete(category)
  }

  getEquipped(category: ClothingCategory): Clothing | undefined {
    return this.equipped.get(category)
  }

  getOutfit(): Clothing[] {
    return [...this.equipped.values()]
  }

  getEquippedCategories(): Set<ClothingCategory> {
    return new Set(this.equipped.keys())
  }

  isCategoryEquipped(category: ClothingCategory): boolean {
    return this.equipped.has(category)
  }

  clear(): void {
    this.equipped.clear()
  }

  getCompletionRatio(): number {
    return this.equipped.size / EQUIPPABLE_CATEGORIES.length
  }

  swap(newItem: Clothing): Clothing | undefined {
    const old = this.equipped.get(newItem.category)
    this.equipped.set(newItem.category, newItem)
    return old
  }
}
