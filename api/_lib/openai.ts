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

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)

    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        throw new Error(`Assistant run ${runStatus.status}`)
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
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

    // Parse the response
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
    // For vision, use regular completion API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
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
      max_tokens: 500,
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
  // Extract values using regex patterns
  const giMatch = text.match(/(?:GI|Glycemic Index)[:\s]+(\d+)/i)
  const glMatch = text.match(/(?:GL|Glycemic Load)[:\s]+(\d+(?:\.\d+)?)/i)
  const caloriesMatch = text.match(/(?:Calories)[:\s]+(\d+)/i)
  const foodMatch = text.match(/(?:Food|Name)[:\s]+([^\n]+)/i)
  const portionMatch = text.match(/(?:Portion|Serving)[:\s]+([^\n]+)/i)

  // Extract recommendations (everything after "recommendations:" or similar)
  const recsMatch = text.match(/(?:recommendations|advice|tips)[:\s]+(.+)/is)

  return {
    gi: giMatch ? parseInt(giMatch[1]) : 50,
    gl: glMatch ? parseFloat(glMatch[1]) : 10,
    calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 100,
    recommendations: recsMatch ? recsMatch[1].trim() : 'Moderate consumption recommended.',
    foodName: foodMatch ? foodMatch[1].trim() : undefined,
    portionSize: portionMatch ? portionMatch[1].trim() : undefined,
  }
}
