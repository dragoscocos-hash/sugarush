import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function parseAssistantResponse(text: string) {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const json = JSON.parse(cleaned)
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
    const { image } = await request.json()
    if (!image) {
      return new Response(JSON.stringify({ message: 'Image is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert. Analyze the food in the image and respond with a JSON object containing: food_name (string), glycemic_index (number), glycemic_load_100g (number), caloric_value_100g (number), analysis (string with health recommendations), suggestions (array of {alternative, rationale} objects).',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this food image and provide: 1. Food name and estimated portion size 2. Glycemic Index (GI) 3. Glycemic Load (GL) 4. Estimated calories 5. Health recommendations' },
            {
              type: 'image_url',
              image_url: {
                url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from vision API')

    const analysis = parseAssistantResponse(content)

    return new Response(JSON.stringify({
      source: 'photo',
      portionSize: analysis.portionSize || 'estimated serving',
      ...analysis,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Image analysis error:', error)
    return new Response(JSON.stringify({
      message: error instanceof Error ? error.message : 'Image analysis failed',
    }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
