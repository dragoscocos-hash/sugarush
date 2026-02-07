import { MealEntry, DailySummary } from '@/types'
import { startOfDay, format } from 'date-fns'

const STORAGE_KEY = 'sugarush_meals'

export function saveMeal(meal: MealEntry): void {
  const meals = getAllMeals()
  meals.push(meal)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals))
}

export function getAllMeals(): MealEntry[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function getMealsByDate(date: Date): MealEntry[] {
  const meals = getAllMeals()
  const targetDate = format(startOfDay(date), 'yyyy-MM-dd')

  return meals.filter(meal => {
    const mealDate = format(startOfDay(new Date(meal.timestamp)), 'yyyy-MM-dd')
    return mealDate === targetDate
  })
}

export function getDailySummary(date: Date): DailySummary {
  const meals = getMealsByDate(date)

  const totalGL = meals.reduce((sum, meal) => sum + meal.gl, 0)
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
  const averageGI = meals.length > 0
    ? meals.reduce((sum, meal) => sum + meal.gi, 0) / meals.length
    : 0

  return {
    date: format(date, 'yyyy-MM-dd'),
    totalGL,
    totalCalories,
    meals,
    averageGI,
  }
}

export function getWeeklySummaries(endDate: Date): DailySummary[] {
  const summaries: DailySummary[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - i)
    summaries.push(getDailySummary(date))
  }

  return summaries
}

export function deleteMeal(id: string): void {
  const meals = getAllMeals()
  const filtered = meals.filter(meal => meal.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
