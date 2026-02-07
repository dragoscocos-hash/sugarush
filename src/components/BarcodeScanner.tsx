import { useState, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [manualBarcode, setManualBarcode] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<ScannerControls | null>(null)

  const handleBarcodeFound = async (barcode: string) => {
    setIsAnalyzing(true)
    setError(null)
    try {
      const analysis = await analyzeBarcode(barcode)
      onAnalyze(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setIsAnalyzing(false)
    }
  }

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
            await handleBarcodeFound(barcode)
          }
        }
      )
      controlsRef.current = controls
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera error'
      setError(`Camera failed: ${msg}. Use manual entry below.`)
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setIsScanning(false)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualBarcode.trim()) return
    await handleBarcodeFound(manualBarcode.trim())
  }

  return (
    <div className="space-y-4">
      {/* Camera scanner */}
      {isScanning ? (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-2 border-primary m-4 rounded-lg pointer-events-none" />
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground text-sm text-center px-4">
            Tap "Start Scanning" to use your camera,<br />
            or enter a barcode number below
          </p>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>
      )}

      <Button
        onClick={isScanning ? stopScanning : startScanning}
        className="w-full"
        disabled={isAnalyzing}
      >
        {isScanning ? 'Stop Scanning' : 'Start Camera Scan'}
      </Button>

      {/* Manual barcode entry fallback */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">or enter barcode manually</span>
        </div>
      </div>

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          placeholder="e.g., 5449000000996"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <Button type="submit" disabled={isAnalyzing || !manualBarcode.trim()}>
          Look Up
        </Button>
      </form>
    </div>
  )
}
