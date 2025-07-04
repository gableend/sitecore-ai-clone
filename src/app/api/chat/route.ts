import { type NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Database types
interface CaseStudy {
  id: string
  business_model: string
  persona: string
  glossary_keys: {
    impacts: string[]
    terms: string[]
  }
  [key: string]: unknown
}

interface Database {
  case_studies: CaseStudy[]
  products: unknown[]
  stack: unknown[]
  glossary: unknown[]
}

interface Filters {
  businessModel?: string
  persona?: string
  impacts?: string[]
}

// Load database - this will be cached by Node.js module system
let database: Database | null = null
function loadDatabase(): Database {
  if (!database) {
    try {
      const databasePath = join(process.cwd(), 'api', 'database.json')
      database = JSON.parse(readFileSync(databasePath, 'utf-8')) as Database
    } catch (error) {
      console.error('CRITICAL ERROR: Failed to load database.json:', error)
      database = { case_studies: [], products: [], stack: [], glossary: [] }
    }
  }
  return database
}

// Define the request schema
const RequestSchema = z.object({
  userPrompt: z.string(),
  selectedModelType: z.string().optional().default('openai'),
  filters: z.object({
    businessModel: z.string().optional(),
    persona: z.string().optional(),
    impacts: z.array(z.string()).optional(),
  }).optional().default({}),
})

// Define the filter request schema
const FilterRequestSchema = z.object({
  filters: z.object({
    businessModel: z.string().optional(),
    persona: z.string().optional(),
    impacts: z.array(z.string()).optional(),
  }).optional().default({}),
})

// Helper function: Apply Filters (converted from Python)
function applyFilters(caseStudies: CaseStudy[], filters: Filters) {
  let filteredStudies = [...caseStudies]

  const businessModel = filters.businessModel
  if (businessModel) {
    filteredStudies = filteredStudies.filter(s =>
      s.business_model?.toLowerCase() === businessModel.toLowerCase()
    )
  }

  const persona = filters.persona
  if (persona) {
    filteredStudies = filteredStudies.filter(s =>
      s.persona?.toLowerCase() === persona.toLowerCase()
    )
  }

  const impacts = filters.impacts
  if (impacts && Array.isArray(impacts)) {
    filteredStudies = filteredStudies.filter(s => {
      const studyImpacts = s.glossary_keys?.impacts || []
      return impacts.some(impact =>
        studyImpacts.some((studyImpact: string) =>
          studyImpact.toLowerCase().includes(impact.toLowerCase()) ||
          impact.toLowerCase().includes(studyImpact.toLowerCase())
        )
      )
    })
  }

  return filteredStudies
}

// Core AI Analysis Function (converted from Python)
async function getAiAnalysis(userPrompt: string, selectedModelType: string, filtersData: Filters) {
  const fullDatabase = loadDatabase()
  const relevantCaseStudies = applyFilters(fullDatabase.case_studies || [], filtersData)

  if (!relevantCaseStudies.length) {
    return "No case studies match your selection. Please adjust your filters."
  }

  // Prepare data for the AI prompt
  const dataForPrompt = {
    relevant_case_studies: relevantCaseStudies,
    full_glossary: fullDatabase.glossary || [],
    full_products_list: fullDatabase.products || []
  }
  const dataStr = JSON.stringify(dataForPrompt, null, 2)

  const systemMessage = `
    You are an expert data analyst. You will be provided with a curated list of relevant case studies and a full data glossary.
    Your sole task is to answer the user's question based ONLY on this provided data.
  `

  const fullPrompt = `Here is the data for your analysis:\n\`\`\`json\n${dataStr}\n\`\`\`\n\nHere is my question:\n"${userPrompt}"`

  try {
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    const openaiApiKey = process.env.OPENAI_API_KEY

    let response: { choices?: { message?: { content?: string } }[] }

    if (selectedModelType === 'azure' && azureApiKey && azureEndpoint && azureDeployment) {
      // Use Azure OpenAI
      console.log('DEBUG: Using Azure OpenAI')
      const azureResponse = await fetch(`${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-02-15-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureApiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0,
          max_tokens: 4000,
        }),
      })

      if (!azureResponse.ok) {
        const errorData = await azureResponse.json()
        return `Azure OpenAI API Error (${azureResponse.status}): ${errorData.error?.message || 'Unknown error'}`
      }

      response = await azureResponse.json()
      return response.choices?.[0]?.message?.content || "Received an empty response from Azure OpenAI."

    } else {
      // Use standard OpenAI
      console.log('DEBUG: Using Standard OpenAI')
      if (!openaiApiKey) {
        return "Server configuration error: No OpenAI API key configured."
      }

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0,
          max_tokens: 4000,
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json()
        return `OpenAI API Error (${openaiResponse.status}): ${errorData.error?.message || 'Unknown error'}`
      }

      response = await openaiResponse.json()
      return response.choices?.[0]?.message?.content || "Received an empty response from OpenAI."
    }

  } catch (error: unknown) {
    console.error('Unhandled error in getAiAnalysis:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    if (errorMessage.includes('fetch')) {
      return `API Connection Error: Could not connect to the AI service. Error: ${errorMessage}`
    }
    return `An unexpected server error occurred during AI analysis: ${errorMessage}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userPrompt, selectedModelType, filters } = RequestSchema.parse(body)

    // Basic input validation
    if (!userPrompt) {
      return NextResponse.json(
        { error: 'Missing userPrompt in request body.' },
        { status: 400 }
      )
    }

    // Call the AI analysis function
    const aiResponseText = await getAiAnalysis(userPrompt, selectedModelType, filters)

    // Return the AI's response
    return NextResponse.json({
      success: true,
      response: aiResponseText,
      usingAI: true
    })

  } catch (error: unknown) {
    console.error('Error in chat API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal Server Error', message: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  const database = loadDatabase()

  console.log('Database loaded:', !!database)
  console.log('Case studies count:', database.case_studies?.length || 0)
  console.log('First case study ID:', database.case_studies?.[0]?.id || 'No case studies')

  // Return all case studies from the database
  return NextResponse.json({
    success: true,
    case_studies: database.case_studies || [],
    total: database.case_studies?.length || 0
  })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { filters } = FilterRequestSchema.parse(body)

    console.log('PUT - Filters received:', filters)

    const database = loadDatabase()
    const filteredStudies = applyFilters(database.case_studies || [], filters)

    console.log('PUT - Filtered studies count:', filteredStudies.length)
    console.log('PUT - Total available studies:', database.case_studies?.length || 0)

    return NextResponse.json({
      success: true,
      case_studies: filteredStudies,
      total: filteredStudies.length,
      filters_applied: filters
    })

  } catch (error: unknown) {
    console.error('Error in filter API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal Server Error', message: errorMessage },
      { status: 500 }
    )
  }
}
