export interface FoodAnalysis {
  foodName: string
  gi: number
  gl: number
  calories: number
  portionSize: string
  recommendations: string
  imageUrl?: string
  source: 'manual' | 'barcode' | 'photo'
}

export interface MealEntry {
  id: string
  timestamp: number
  foodName: string
  gi: number
  gl: number
  calories: number
  portionSize: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  imageUrl?: string
}

export interface DailySummary {
  date: string
  totalGL: number
  totalCalories: number
  meals: MealEntry[]
  averageGI: number
}

export interface AnalysisRequest {
  foodName?: string
  barcode?: string
  image?: string
  portionSize?: string
  nutrients?: {
    carbs?: number
    fiber?: number
    sugar?: number
  }
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type GILevel = 'low' | 'medium' | 'high'

export function getGILevel(gi: number): GILevel {
  if (gi <= 55) return 'low'
  if (gi <= 69) return 'medium'
  return 'high'
}

export function getGIColor(gi: number): string {
  const level = getGILevel(gi)
  return {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
  }[level]
}
