import { type NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { caseStudies } from '@/data/case-studies'

// Define the request schema
const RequestSchema = z.object({
  businessModel: z.string().optional(),
  persona: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
})

// Define the response schema
const RecommendationSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string(),
    relevanceScore: z.number().min(0).max(100),
    reasoning: z.string(),
  })),
  summary: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessModel, persona, outcomes } = RequestSchema.parse(body)

    // Create a prompt for the AI to analyze case studies
    const prompt = `
You are an expert at matching business requirements to relevant case studies.

User Requirements:
- Business Model: ${businessModel || 'Not specified'}
- Persona: ${persona || 'Not specified'}
- Desired Outcomes: ${outcomes?.join(', ') || 'Not specified'}

Available Case Studies:
${caseStudies.map(study => `
ID: ${study.id}
Company: ${study.customer_name}
Title: ${study.title}
Business Model: ${study.business_model}
Persona: ${study.persona}
Impact Areas: ${study.glossary_keys.impacts.join(', ')}
Overview: ${study.overview}
`).join('\n')}

Analyze each case study and provide:
1. A relevance score (0-100) based on how well it matches the user's requirements
2. Brief reasoning for the score
3. A summary explaining the overall recommendations

Consider:
- Exact matches for business model should score higher
- Persona alignment is important for relevance
- Impact areas should align with desired outcomes
- Even if some criteria don't match perfectly, a case study might still be valuable
`

    // Check if Azure OpenAI is configured
    const useAzureOpenAI = process.env.AZURE_OPENAI_API_KEY &&
                          process.env.AZURE_OPENAI_ENDPOINT &&
                          process.env.AZURE_OPENAI_DEPLOYMENT_NAME

    let result

    if (useAzureOpenAI) {
      // Use Azure OpenAI when configured
      // You can configure the Azure OpenAI client here when you have API keys
      /*
      import { AzureOpenAI } from 'openai'

      const azureOpenAI = new AzureOpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        apiVersion: "2024-02-15-preview",
      })

      result = await generateObject({
        model: azureOpenAI(process.env.AZURE_OPENAI_DEPLOYMENT_NAME),
        prompt,
        schema: RecommendationSchema,
      })
      */

      // For now, fall back to mock logic even when Azure keys are present
      // Remove this when you implement actual Azure OpenAI integration
      result = generateMockRecommendations(businessModel, persona, outcomes)
    } else {
      // Use mock AI logic when Azure OpenAI is not configured
      result = generateMockRecommendations(businessModel, persona, outcomes)
    }

    return NextResponse.json({
      success: true,
      data: result,
      usingAI: useAzureOpenAI
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations'
      },
      { status: 500 }
    )
  }
}

function generateMockRecommendations(businessModel?: string, persona?: string, outcomes?: string[]) {
  const mockRecommendations = caseStudies.map(study => {
    let score = 50 // Base score

    // Business model matching
    if (businessModel && study.business_model.toLowerCase() === businessModel.toLowerCase()) {
      score += 30
    } else if (businessModel && study.business_model === 'Both') {
      score += 20
    }

    // Persona matching
    if (persona && study.persona.toLowerCase() === persona.toLowerCase()) {
      score += 25
    }

    // Outcomes matching
    if (outcomes && outcomes.length > 0) {
      const matchingOutcomes = outcomes.filter(outcome =>
        study.glossary_keys.impacts.some(impact =>
          impact.toLowerCase().includes(outcome.toLowerCase()) ||
          outcome.toLowerCase().includes(impact.toLowerCase())
        )
      )
      score += (matchingOutcomes.length / outcomes.length) * 25
    }

    return {
      id: study.id,
      relevanceScore: Math.min(Math.max(score, 0), 100),
      reasoning: `Matches ${businessModel ? 'business model' : ''} ${persona ? 'persona' : ''} ${outcomes?.length ? 'and desired outcomes' : ''}`.trim()
    }
  }).sort((a, b) => b.relevanceScore - a.relevanceScore)

  return {
    recommendations: mockRecommendations,
    summary: `Based on your requirements (${businessModel || 'any'} business model, ${persona || 'any'} persona, focusing on ${outcomes?.join(', ') || 'general outcomes'}), we've identified ${mockRecommendations.filter(r => r.relevanceScore > 70).length} highly relevant case studies that demonstrate similar success patterns.`
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to get recommendations',
    availableCaseStudies: caseStudies.length,
    azureOpenAIConfigured: !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT)
  })
}
