import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FoodAnalysis, getGIColor, getGILevel, MealType } from '@/types'
import { saveMeal } from '@/lib/storage'

interface Props {
  result: FoodAnalysis
}

export function ResultsCard({ result }: Props) {
  const [showLogDialog, setShowLogDialog] = useState(false)
  const [mealType, setMealType] = useState<MealType>('lunch')

  const handleLog = () => {
    saveMeal({
      id: Date.now().toString(),
      timestamp: Date.now(),
      foodName: result.foodName,
      gi: result.gi,
      gl: result.gl,
      calories: result.calories,
      portionSize: result.portionSize,
      mealType,
      imageUrl: result.imageUrl,
    })
    setShowLogDialog(false)
    alert('Meal logged successfully!')
  }

  const giLevel = getGILevel(result.gi)
  const giColor = getGIColor(result.gi)

  return (
    <>
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold">{result.foodName}</h3>
            <p className="text-sm text-muted-foreground">{result.portionSize}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">GI</div>
              <div className={`text-2xl font-bold ${giColor}`}>
                {result.gi}
              </div>
              <div className="text-xs capitalize">{giLevel}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">GL</div>
              <div className="text-2xl font-bold">{result.gl.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Calories</div>
              <div className="text-2xl font-bold">{result.calories}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {result.recommendations}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              New Analysis
            </Button>
            <Button onClick={() => setShowLogDialog(true)}>
              Log This Meal
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Meal Type</label>
              <select
                className="w-full mt-2 p-2 rounded-md bg-background border border-border"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <Button onClick={handleLog} className="w-full">
              Save to Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
