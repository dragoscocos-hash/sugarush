import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ASSISTANT_ID = process.env.ASSISTANT_ID || 'asst_OwTl4sIM9SP7fhGGKOSrA9Tp'

interface AssistantResponse {
  gi: number
  gl: number
  calories: number
  recommendations: string
  foodName?: string
  portionSize?: string
}

export async function analyzeWithAssistant(prompt: string): Promise<AssistantResponse> {
  try {
    // Create a thread
    const thread = await openai.beta.threads.create()

    // Add message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: prompt,
    })

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    })

    // Wait for completion with timeout
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    let attempts = 0
    const maxAttempts = 45 // ~45 seconds

    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Assistant run ${runStatus.status}: ${runStatus.last_error?.message || 'unknown error'}`)
      }

      if (attempts >= maxAttempts) {
        throw new Error('Assistant run timed out')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
      attempts++
    }

    // Get the messages
    const messages = await openai.beta.threads.messages.list(thread.id)
    const lastMessage = messages.data[0]

    if (!lastMessage || lastMessage.role !== 'assistant') {
      throw new Error('No assistant response')
    }

    const content = lastMessage.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return parseAssistantResponse(content.text.value)
  } catch (error) {
    console.error('OpenAI Assistant error:', error)
    throw error
  }
}

export async function analyzeWithAssistantVision(
  prompt: string,
  imageBase64: string
): Promise<AssistantResponse> {
  try {
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
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from vision API')
    }

    return parseAssistantResponse(content)
  } catch (error) {
    console.error('OpenAI Vision error:', error)
    throw error
  }
}

function parseAssistantResponse(text: string): AssistantResponse {
  // Try to parse as JSON first (the assistant is configured to return JSON)
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const json = JSON.parse(cleaned)

    // Handle the assistant's JSON format
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

    // Handle other JSON formats
    return {
      gi: json.gi ?? json.GI ?? json.glycemic_index ?? 50,
      gl: json.gl ?? json.GL ?? json.glycemic_load ?? 10,
      calories: json.calories ?? json.caloric_value ?? 100,
      recommendations: json.recommendations ?? json.analysis ?? 'Moderate consumption recommended.',
      foodName: json.foodName ?? json.food_name,
      portionSize: json.portionSize ?? json.portion_size ?? '100g',
    }
  } catch {
    // Not JSON - could be a humorous rejection or plain text
  }

  // Check if it's a humorous rejection (non-food input)
  if (text.includes("don't really want to eat") || text.includes("not recognized as food")) {
    return {
      gi: 0,
      gl: 0,
      calories: 0,
      recommendations: text,
      foodName: 'Not a food item',
      portionSize: 'N/A',
    }
  }

  // Fallback: regex extraction for plain text responses
  const giMatch = text.match(/(?:GI|Glycemic Index)[:\s]+(\d+)/i)
  const glMatch = text.match(/(?:GL|Glycemic Load)[:\s]+(\d+(?:\.\d+)?)/i)
  const caloriesMatch = text.match(/(?:Calories|caloric)[:\s]+(\d+)/i)
  const foodMatch = text.match(/(?:Food|Name)[:\s]+([^\n]+)/i)

  return {
    gi: giMatch ? parseInt(giMatch[1]) : 50,
    gl: glMatch ? parseFloat(glMatch[1]) : 10,
    calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 100,
    recommendations: text.substring(0, 500),
    foodName: foodMatch ? foodMatch[1].trim() : undefined,
    portionSize: '100g',
  }
}
