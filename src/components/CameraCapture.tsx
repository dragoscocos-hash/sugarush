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

function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

export function CameraCapture({ onAnalyze, isAnalyzing, setIsAnalyzing }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [compressedImage, setCompressedImage] = useState<string | null>(null)
  const [portionSize, setPortionSize] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setPreview(base64)
      // Compress for API call
      const compressed = await compressImage(base64)
      setCompressedImage(compressed)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!compressedImage) return
    setIsAnalyzing(true)

    try {
      const result = await analyzeImage(compressedImage)
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
    setCompressedImage(null)
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
