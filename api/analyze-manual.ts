import type { VercelRequest, VercelResponse } from '@vercel/node'
import { analyzeWithAssistant } from './_lib/openai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { foodName, portionSize, nutrients } = req.body

    if (!foodName) {
      return res.status(400).json({ message: 'Food name is required' })
    }

    let prompt = `Analyze this food: "${foodName}"`

    if (portionSize) {
      prompt += ` (portion: ${portionSize})`
    }

    if (nutrients) {
      prompt += `\nNutrients per serving: ${JSON.stringify(nutrients)}`
    }

    prompt += '\n\nProvide:\n1. Glycemic Index (GI)\n2. Glycemic Load (GL) for the portion\n3. Calories for the portion\n4. Health recommendations'

    const analysis = await analyzeWithAssistant(prompt)

    return res.status(200).json({
      foodName,
      portionSize: portionSize || '1 serving',
      source: 'manual',
      ...analysis,
    })
  } catch (error) {
    console.error('Manual analysis error:', error)
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Analysis failed',
    })
  }
}
