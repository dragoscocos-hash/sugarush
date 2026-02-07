import type { VercelRequest, VercelResponse } from '@vercel/node'
import { lookupBarcode } from './_lib/openfoodfacts'
import { analyzeWithAssistant } from './_lib/openai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { barcode } = req.body

    if (!barcode) {
      return res.status(400).json({ message: 'Barcode is required' })
    }

    // Clean barcode
    const cleanBarcode = barcode.replace(/[^0-9]/g, '')

    if (!/^[0-9]{8,14}$/.test(cleanBarcode)) {
      return res.status(400).json({
        message: 'Invalid barcode format. Must be 8-14 digits.',
      })
    }

    // Lookup product in Open Food Facts
    const product = await lookupBarcode(cleanBarcode)

    // Use Assistant API for GL/GI analysis
    const prompt = `Analyze this food product from barcode database:
Product: ${product.name}
Serving size: ${product.servingSize || '100g'}
Nutrients per serving:
- Carbohydrates: ${product.carbs}g
- Fiber: ${product.fiber}g
- Sugars: ${product.sugar}g
- Protein: ${product.protein}g
- Fat: ${product.fat}g
- Calories: ${product.calories}

Calculate:
1. Glycemic Index (GI)
2. Glycemic Load (GL) for the serving
3. Provide health recommendations`

    const analysis = await analyzeWithAssistant(prompt)

    return res.status(200).json({
      foodName: product.name,
      portionSize: product.servingSize || '100g',
      imageUrl: product.imageUrl,
      source: 'barcode',
      calories: product.calories,
      ...analysis,
    })
  } catch (error) {
    console.error('Barcode analysis error:', error)
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Barcode analysis failed',
    })
  }
}
