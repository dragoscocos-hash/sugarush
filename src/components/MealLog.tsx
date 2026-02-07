import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { MealEntry, getGIColor } from '@/types'
import { deleteMeal } from '@/lib/storage'
import { formatTime } from '@/lib/utils'

interface Props {
  meals: MealEntry[]
}

export function MealLog({ meals }: Props) {
  const handleDelete = (id: string) => {
    if (confirm('Delete this meal?')) {
      deleteMeal(id)
      window.location.reload()
    }
  }

  if (meals.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        No meals logged today
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <Card key={meal.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{meal.foodName}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">
                  {meal.mealType}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatTime(meal.timestamp)} • {meal.portionSize}
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <span className={getGIColor(meal.gi)}>GI {meal.gi}</span>
                <span>GL {meal.gl.toFixed(1)}</span>
                <span>{meal.calories} cal</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(meal.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
