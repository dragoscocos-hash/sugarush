import { analyzeWithAssistantVision } from './_lib/openai'

export async function POST(request: Request) {
  try {
    const { image } = await request.json()

    if (!image) {
      return new Response(JSON.stringify({ message: 'Image is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prompt = `Analyze this food image and provide:
1. Food name and estimated portion size
2. Glycemic Index (GI)
3. Glycemic Load (GL)
4. Estimated calories
5. Health recommendations`

    const analysis = await analyzeWithAssistantVision(prompt, image)

    return new Response(JSON.stringify({
      source: 'photo',
      portionSize: analysis.portionSize || 'estimated serving',
      ...analysis,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Image analysis error:', error)
    return new Response(JSON.stringify({
      message: error instanceof Error ? error.message : 'Image analysis failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
