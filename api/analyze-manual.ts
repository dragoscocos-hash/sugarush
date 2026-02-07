import { analyzeWithAssistant } from './_lib/openai'

export async function POST(request: Request) {
  try {
    const { foodName, portionSize, nutrients } = await request.json()

    if (!foodName) {
      return new Response(JSON.stringify({ message: 'Food name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
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

    return new Response(JSON.stringify({
      foodName,
      portionSize: portionSize || '1 serving',
      source: 'manual',
      ...analysis,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Manual analysis error:', error)
    return new Response(JSON.stringify({
      message: error instanceof Error ? error.message : 'Analysis failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
