import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ASSISTANT_ID = process.env.ASSISTANT_ID || 'asst_OwTl4sIM9SP7fhGGKOSrA9Tp'

function parseAssistantResponse(text: string) {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
    const json = JSON.parse(jsonStr)
    if (json.food_name || json.glycemic_index !== undefined) {
      const suggestions = Array.isArray(json.suggestions)
        ? json.suggestions.map((s: { alternative?: string; rationale?: string }) => `${s.alternative}: ${s.rationale}`).join('. ')
        : ''
      return {
        gi: json.glycemic_index ?? 50,
        gl: json.glycemic_load ?? json.glycemic_load_100g ?? 10,
        calories: json.calories ?? json.caloric_value_100g ?? 100,
        recommendations: json.analysis || suggestions || 'Moderate consumption recommended.',
        foodName: json.food_name,
        portionSize: json.portion_size,
      }
    }
    return {
      gi: json.gi ?? json.GI ?? json.glycemic_index ?? 50,
      gl: json.gl ?? json.GL ?? json.glycemic_load ?? 10,
      calories: json.calories ?? json.caloric_value ?? 100,
      recommendations: json.recommendations ?? json.analysis ?? 'Moderate consumption recommended.',
      foodName: json.foodName ?? json.food_name,
      portionSize: json.portionSize ?? json.portion_size,
    }
  } catch {
    // not JSON
  }
  const giMatch = text.match(/(?:GI|Glycemic Index)[:\s]+(\d+)/i)
  const glMatch = text.match(/(?:GL|Glycemic Load)[:\s]+(\d+(?:\.\d+)?)/i)
  const caloriesMatch = text.match(/(?:Calories|caloric)[:\s]+(\d+)/i)
  return {
    gi: giMatch ? parseInt(giMatch[1]) : 50,
    gl: glMatch ? parseFloat(glMatch[1]) : 10,
    calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 100,
    recommendations: text.substring(0, 500),
    foodName: undefined as string | undefined,
  }
}

async function lookupBarcode(barcode: string) {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
  )
  if (!response.ok) throw new Error('Product not found in database')
  const data = await response.json()
  if (data.status !== 1) throw new Error('Product not found')

  const product = data.product
  const nutrients = product.nutriments || {}
  return {
    name: product.product_name || product.generic_name || 'Unknown Product',
    servingSize: product.serving_size || '100g',
    carbs: nutrients.carbohydrates_100g || nutrients.carbohydrates || 0,
    fiber: nutrients.fiber_100g || nutrients.fiber || 0,
    sugar: nutrients.sugars_100g || nutrients.sugars || 0,
    protein: nutrients.proteins_100g || nutrients.proteins || 0,
    fat: nutrients.fat_100g || nutrients.fat || 0,
    calories: nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0,
    imageUrl: product.image_url || product.image_front_url,
  }
}

export async function POST(request: Request) {
  try {
    const { barcode } = await request.json()
    if (!barcode) {
      return new Response(JSON.stringify({ message: 'Barcode is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const cleanBarcode = barcode.replace(/[^0-9]/g, '')
    if (!/^[0-9]{8,14}$/.test(cleanBarcode)) {
      return new Response(JSON.stringify({ message: 'Invalid barcode format. Must be 8-14 digits.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const product = await lookupBarcode(cleanBarcode)

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

    const thread = await openai.beta.threads.create()
    await openai.beta.threads.messages.create(thread.id, { role: 'user', content: prompt })
    const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: ASSISTANT_ID })

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    let attempts = 0
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Assistant run ${runStatus.status}`)
      }
      if (attempts >= 45) throw new Error('Assistant run timed out')
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
      attempts++
    }

    const messages = await openai.beta.threads.messages.list(thread.id)
    const lastMessage = messages.data[0]
    if (!lastMessage || lastMessage.role !== 'assistant') throw new Error('No assistant response')
    const content = lastMessage.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const analysis = parseAssistantResponse(content.text.value)

    return new Response(JSON.stringify({
      foodName: product.name,
      portionSize: product.servingSize || '100g',
      imageUrl: product.imageUrl,
      source: 'barcode',
      calories: product.calories,
      ...analysis,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Barcode analysis error:', error)
    return new Response(JSON.stringify({
      message: error instanceof Error ? error.message : 'Barcode analysis failed',
    }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
