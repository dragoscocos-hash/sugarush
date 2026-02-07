import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scan } from 'lucide-react'
import { analyzeBarcode } from '@/lib/api'
import { FoodAnalysis } from '@/types'

interface Props {
  onAnalyze: (result: FoodAnalysis) => void
  isAnalyzing: boolean
  setIsAnalyzing: (val: boolean) => void
}

export function BarcodeScanner({ onAnalyze, isAnalyzing, setIsAnalyzing }: Props) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [hasBarcodeApi, setHasBarcodeApi] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)

  useEffect(() => {
    // Check if native BarcodeDetector is available
    setHasBarcodeApi('BarcodeDetector' in window)
  }, [])

  const handleBarcodeFound = useCallback(async (barcode: string) => {
    stopCamera()
    setIsAnalyzing(true)
    setError(null)
    try {
      const analysis = await analyzeBarcode(barcode)
      onAnalyze(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setIsAnalyzing(false)
    }
  }, [onAnalyze, setIsAnalyzing])

  const stopCamera = useCallback(() => {
    scanningRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScanning = async () => {
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      setIsScanning(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      if (hasBarcodeApi) {
        // Use native BarcodeDetector
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
        })

        scanningRef.current = true
        const scanLoop = async () => {
          if (!scanningRef.current || !videoRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0) {
              await handleBarcodeFound(barcodes[0].rawValue)
              return
            }
          } catch {
            // detection failed this frame, continue
          }
          if (scanningRef.current) {
            requestAnimationFrame(scanLoop)
          }
        }
        requestAnimationFrame(scanLoop)
      } else {
        // No native API - try zxing as fallback
        try {
          const { BrowserMultiFormatReader } = await import('@zxing/browser')
          const codeReader = new BrowserMultiFormatReader()
          if (!videoRef.current) return

          const controls = await codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            async (result, _err, controls) => {
              if (result) {
                controls.stop()
                await handleBarcodeFound(result.getText())
              }
            }
          )
          // Store stop function
          const origStop = stopCamera
          streamRef.current = stream
          // Override cleanup to also stop zxing
          const cleanup = () => {
            controls.stop()
            origStop()
          }
          // If user stops scanning, clean up zxing too
          streamRef.current.getTracks()[0].addEventListener('ended', () => cleanup())
        } catch {
          setError('Camera barcode scanning not supported on this browser. Use manual entry below.')
          stopCamera()
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings, or enter the barcode manually below.')
      } else {
        setError(`Camera failed: ${msg}. Enter barcode manually below.`)
      }
      setIsScanning(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualBarcode.trim()) return
    await handleBarcodeFound(manualBarcode.trim())
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="space-y-4">
      {isScanning ? (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/2 border-2 border-primary rounded-lg">
              <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-0.5 bg-red-500 animate-pulse" />
            </div>
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
              Point camera at barcode
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2">
          <Scan className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center px-4">
            Scan a barcode with your camera<br />
            or type it in below
          </p>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
      )}

      <Button
        onClick={isScanning ? stopCamera : startScanning}
        className="w-full"
        disabled={isAnalyzing}
      >
        {isScanning ? 'Stop Scanning' : 'Start Camera Scan'}
      </Button>

      {/* Manual barcode entry */}
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
