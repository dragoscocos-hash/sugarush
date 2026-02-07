import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ASSISTANT_ID = process.env.ASSISTANT_ID || 'asst_OwTl4sIM9SP7fhGGKOSrA9Tp'

function parseAssistantResponse(text: string) {
  try {
    // Extract JSON from code fences if present, otherwise try the whole text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
    const json = JSON.parse(jsonStr)
    if (json.food_name || json.glycemic_index !== undefined) {
      const suggestions = Array.isArray(json.suggestions)
        ? json.suggestions.map((s: { alternative?: string; rationale?: string }) => `${s.alternative}: ${s.rationale}`).join('. ')
        : ''
      return {
        gi: json.glycemic_index ?? 50,
        gl: json.glycemic_load_100g ?? 10,
        calories: json.caloric_value_100g ?? 100,
        recommendations: json.analysis || suggestions || 'Moderate consumption recommended.',
        foodName: json.food_name,
        portionSize: '100g',
      }
    }
    return {
      gi: json.gi ?? json.GI ?? json.glycemic_index ?? 50,
      gl: json.gl ?? json.GL ?? json.glycemic_load ?? 10,
      calories: json.calories ?? json.caloric_value ?? 100,
      recommendations: json.recommendations ?? json.analysis ?? 'Moderate consumption recommended.',
      foodName: json.foodName ?? json.food_name,
      portionSize: json.portionSize ?? json.portion_size ?? '100g',
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
    portionSize: '100g',
  }
}

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
    if (portionSize) prompt += ` (portion: ${portionSize})`
    if (nutrients) prompt += `\nNutrients per serving: ${JSON.stringify(nutrients)}`
    prompt += '\n\nProvide:\n1. Glycemic Index (GI)\n2. Glycemic Load (GL) for the portion\n3. Calories for the portion\n4. Health recommendations'

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
      foodName: analysis.foodName || foodName,
      portionSize: portionSize || analysis.portionSize || '1 serving',
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
