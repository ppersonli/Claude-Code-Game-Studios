export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: string;
  reward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_merge', name: 'First Merge', description: 'Complete your first merge', condition: 'merge_count >= 1', reward: 100 },
  { id: 'sell_10', name: 'Small Merchant', description: 'Sell 10 products', condition: 'products_sold >= 10', reward: 200 },
  { id: 'unlock_3_animals', name: 'Animal Home', description: 'Unlock 3 animals', condition: 'unlocked_animals >= 3', reward: 500 },
  { id: 'merge_100', name: 'Merge Master', description: 'Merge 100 times', condition: 'merge_count >= 100', reward: 1000 },
  { id: 'max_upgrade', name: 'Workshop Boss', description: 'Upgrade workshop to max level', condition: 'any_upgrade_max == true', reward: 2000 },
  { id: 'collect_all', name: 'Collector', description: 'Collect all products', condition: 'all_products_collected == true', reward: 0 },
];
