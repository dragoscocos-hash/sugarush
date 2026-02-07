import { useState, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { analyzeBarcode } from '@/lib/api'
import { FoodAnalysis } from '@/types'

interface Props {
  onAnalyze: (result: FoodAnalysis) => void
  isAnalyzing: boolean
  setIsAnalyzing: (val: boolean) => void
}

interface ScannerControls {
  stop: () => void
}

export function BarcodeScanner({ onAnalyze, isAnalyzing, setIsAnalyzing }: Props) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<ScannerControls | null>(null)

  const startScanning = async () => {
    setIsScanning(true)
    setError(null)

    try {
      const codeReader = new BrowserMultiFormatReader()

      if (!videoRef.current) return

      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result, _error, controls) => {
          if (result) {
            const barcode = result.getText()
            controls.stop()
            controlsRef.current = null
            setIsScanning(false)
            setIsAnalyzing(true)

            try {
              const analysis = await analyzeBarcode(barcode)
              onAnalyze(analysis)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Analysis failed')
              setIsAnalyzing(false)
            }
          }
        }
      )
      controlsRef.current = controls
    } catch (_err) {
      setError('Camera access denied')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setIsScanning(false)
  }

  return (
    <div className="space-y-4">
      {isScanning ? (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-2 border-primary m-4 rounded-lg pointer-events-none" />
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Camera preview will appear here</p>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <Button
        onClick={isScanning ? stopScanning : startScanning}
        className="w-full"
        disabled={isAnalyzing}
      >
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </Button>
    </div>
  )
}
