import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'
import { analyzeImage } from '@/lib/api'
import { FoodAnalysis } from '@/types'

interface Props {
  onAnalyze: (result: FoodAnalysis) => void
  isAnalyzing: boolean
  setIsAnalyzing: (val: boolean) => void
}

export function CameraCapture({ onAnalyze, isAnalyzing, setIsAnalyzing }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setPreview(base64)
      setIsAnalyzing(true)

      try {
        const result = await analyzeImage(base64)
        onAnalyze(result)
      } catch (error) {
        console.error(error)
        alert('Analysis failed. Please try again.')
        setIsAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
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

      <Button
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
        disabled={isAnalyzing}
      >
        {preview ? 'Retake Photo' : 'Capture Food'}
      </Button>
    </div>
  )
}
