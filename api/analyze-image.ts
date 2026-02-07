import type { VercelRequest, VercelResponse } from '@vercel/node'
import { analyzeWithAssistantVision } from './_lib/openai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ message: 'Image is required' })
    }

    const prompt = `Analyze this food image and provide:
1. Food name and estimated portion size
2. Glycemic Index (GI)
3. Glycemic Load (GL)
4. Estimated calories
5. Health recommendations`

    const analysis = await analyzeWithAssistantVision(prompt, image)

    return res.status(200).json({
      source: 'photo',
      portionSize: analysis.portionSize || 'estimated serving',
      ...analysis,
    })
  } catch (error) {
    console.error('Image analysis error:', error)
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Image analysis failed',
    })
  }
}
