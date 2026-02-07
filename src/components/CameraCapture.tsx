import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Send } from 'lucide-react'
import { analyzeImage } from '@/lib/api'
import { FoodAnalysis } from '@/types'

interface Props {
  onAnalyze: (result: FoodAnalysis) => void
  isAnalyzing: boolean
  setIsAnalyzing: (val: boolean) => void
}

export function CameraCapture({ onAnalyze, isAnalyzing, setIsAnalyzing }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [portionSize, setPortionSize] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!preview) return
    setIsAnalyzing(true)

    try {
      const result = await analyzeImage(preview)
      // Override portion size if user specified one
      if (portionSize.trim()) {
        result.portionSize = portionSize.trim()
      }
      onAnalyze(result)
    } catch (error) {
      console.error(error)
      alert('Analysis failed. Please try again.')
      setIsAnalyzing(false)
    }
  }

  const handleRetake = () => {
    setPreview(null)
    setPortionSize('')
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="aspect-video rounded-lg overflow-hidden">
          <img src={preview} alt="Captured food" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <Camera className="w-12 h-12 text-muted-foreground" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {!preview ? (
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          disabled={isAnalyzing}
        >
          Capture Food
        </Button>
      ) : (
        <>
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
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleRetake}
              disabled={isAnalyzing}
            >
              Retake Photo
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? 'Analyzing...' : (
                <>
                  <Send className="w-4 h-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
