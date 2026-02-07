import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { analyzeManual } from '@/lib/api'
import { FoodAnalysis } from '@/types'

interface Props {
  onAnalyze: (result: FoodAnalysis) => void
  isAnalyzing: boolean
  setIsAnalyzing: (val: boolean) => void
}

export function ManualEntry({ onAnalyze, isAnalyzing, setIsAnalyzing }: Props) {
  const [foodName, setFoodName] = useState('')
  const [portionSize, setPortionSize] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)

    try {
      const result = await analyzeManual({
        foodName,
        portionSize: portionSize || undefined,
      })
      onAnalyze(result)
    } catch (error) {
      console.error(error)
      alert('Analysis failed. Please try again.')
      setIsAnalyzing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Food Name</label>
        <Input
          placeholder="e.g., Brown rice"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">
          Portion Size (optional)
        </label>
        <Input
          placeholder="e.g., 1 cup, 150g"
          value={portionSize}
          onChange={(e) => setPortionSize(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyzing...' : 'Check GL & Calories'}
      </Button>
    </form>
  )
}
