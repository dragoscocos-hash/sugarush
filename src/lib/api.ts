import { AnalysisRequest, FoodAnalysis } from '@/types'

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'

export async function analyzeManual(request: AnalysisRequest): Promise<FoodAnalysis> {
  const response = await fetch(`${API_BASE}/analyze-manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Analysis failed')
  }

  return response.json()
}

export async function analyzeBarcode(barcode: string): Promise<FoodAnalysis> {
  const response = await fetch(`${API_BASE}/analyze-barcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Barcode analysis failed')
  }

  return response.json()
}

export async function analyzeImage(imageBase64: string): Promise<FoodAnalysis> {
  const response = await fetch(`${API_BASE}/analyze-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Image analysis failed')
  }

  return response.json()
}
