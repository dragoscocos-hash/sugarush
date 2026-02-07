import { lookupBarcode } from './_lib/openfoodfacts'
import { analyzeWithAssistant } from './_lib/openai'

export async function POST(request: Request) {
  try {
    const { barcode } = await request.json()

    if (!barcode) {
      return new Response(JSON.stringify({ message: 'Barcode is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Clean barcode
    const cleanBarcode = barcode.replace(/[^0-9]/g, '')

    if (!/^[0-9]{8,14}$/.test(cleanBarcode)) {
      return new Response(JSON.stringify({
        message: 'Invalid barcode format. Must be 8-14 digits.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
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

    return new Response(JSON.stringify({
      foodName: product.name,
      portionSize: product.servingSize || '100g',
      imageUrl: product.imageUrl,
      source: 'barcode',
      calories: product.calories,
      ...analysis,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Barcode analysis error:', error)
    return new Response(JSON.stringify({
      message: error instanceof Error ? error.message : 'Barcode analysis failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
