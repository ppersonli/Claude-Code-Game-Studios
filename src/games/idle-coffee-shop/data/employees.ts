export interface EmployeeData {
  id: string
  name: string
  cupsPerSec: number
  cost: number
  unlockLevel: number
  maxCount: number
}

export const EMPLOYEES: Record<string, EmployeeData> = {
  intern: { id: 'intern', name: 'Intern', cupsPerSec: 1, cost: 500, unlockLevel: 5, maxCount: 10 },
  barista: { id: 'barista', name: 'Barista', cupsPerSec: 2, cost: 2000, unlockLevel: 15, maxCount: 8 },
  senior: { id: 'senior', name: 'Senior Barista', cupsPerSec: 5, cost: 10000, unlockLevel: 30, maxCount: 5 },
  manager: { id: 'manager', name: 'Store Manager', cupsPerSec: 10, cost: 50000, unlockLevel: 50, maxCount: 3 },
  director: { id: 'director', name: 'Regional Director', cupsPerSec: 25, cost: 200000, unlockLevel: 80, maxCount: 1 },
}
