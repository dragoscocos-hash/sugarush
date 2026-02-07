import { useState } from 'react'
import { Link } from 'wouter'
import { Scan, Camera, Edit3, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { CameraCapture } from '@/components/CameraCapture'
import { ManualEntry } from '@/components/ManualEntry'
import { ResultsCard } from '@/components/ResultsCard'
import { FoodAnalysis } from '@/types'

export function Home() {
  const [activeTab, setActiveTab] = useState<'manual' | 'barcode' | 'photo'>('manual')
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SugaRush
            </h1>
            <p className="text-muted-foreground mt-1">
              Smart glycemic tracking powered by AI
            </p>
          </div>
          <Link href="/log">
            <Button variant="outline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              View Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {/* Input Methods */}
        <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="barcode" className="gap-2">
                <Scan className="w-4 h-4" />
                Scan
              </TabsTrigger>
              <TabsTrigger value="photo" className="gap-2">
                <Camera className="w-4 h-4" />
                Photo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-6">
              <ManualEntry
                onAnalyze={(analysis) => {
                  setResult(analysis)
                  setIsAnalyzing(false)
                }}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            </TabsContent>

            <TabsContent value="barcode" className="mt-6">
              <BarcodeScanner
                onAnalyze={(analysis) => {
                  setResult(analysis)
                  setIsAnalyzing(false)
                }}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            </TabsContent>

            <TabsContent value="photo" className="mt-6">
              <CameraCapture
                onAnalyze={(analysis) => {
                  setResult(analysis)
                  setIsAnalyzing(false)
                }}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Results */}
        <div>
          {result ? (
            <ResultsCard result={result} />
          ) : (
            <Card className="p-12 bg-card/50 backdrop-blur border-border/50 text-center">
              <div className="text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter food details to see analysis</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
