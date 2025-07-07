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
  product_ids?: string[]
  stack_ids?: string[]
  glossary_keys: {
    impacts: string[]
    terms: string[]
  }
  [key: string]: unknown
}

interface Product {
  id: string
  name: string
  Logo: string
  description: string
  video_url: string | null
}

interface Stack {
  id: string
  name: string
  logo: string
  vendor: string
  category: string
  type: string
  description: string
  primary_use: string
}

interface Database {
  case_studies: CaseStudy[]
  products: Product[]
  stack: Stack[]
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
      console.log('🔄 Loading database files...')

      const databasePath = join(process.cwd(), 'api', 'database.json')
      const productsPath = join(process.cwd(), 'api', 'products.json')
      const stackPath = join(process.cwd(), 'api', 'stack.json')

      console.log('📁 Loading main database from:', databasePath)
      const mainData = JSON.parse(readFileSync(databasePath, 'utf-8'))
      console.log('✅ Main database loaded. Case studies found:', mainData.case_studies?.length || 0)

      console.log('📁 Loading products from:', productsPath)
      const productsData = JSON.parse(readFileSync(productsPath, 'utf-8'))
      const products = Array.isArray(productsData) ? productsData : productsData.products || []
      console.log('✅ Products loaded. Count:', products.length)

      console.log('📁 Loading stack from:', stackPath)
      const stackData = JSON.parse(readFileSync(stackPath, 'utf-8'))
      const stack = Array.isArray(stackData) ? stackData : stackData.stack || []
      console.log('✅ Stack loaded. Count:', stack.length)

      database = {
        case_studies: mainData.case_studies || [],
        products: products,
        stack: stack,
        glossary: mainData.glossary || []
      }

      console.log('🎉 Database initialization complete:')
      console.log('   - Case studies:', database.case_studies.length)
      console.log('   - Products:', database.products.length)
      console.log('   - Stack technologies:', database.stack.length)

      // Sample some case studies to check for product_ids and stack_ids
      const sampleSize = Math.min(3, database.case_studies.length)
      console.log(`🔍 Sampling ${sampleSize} case studies for data validation:`)
      for (let i = 0; i < sampleSize; i++) {
        const study = database.case_studies[i]
        console.log(`   ${i + 1}. ${study.id}:`)
        console.log(`      - product_ids: ${study.product_ids?.length || 0} items`, study.product_ids || 'none')
        console.log(`      - stack_ids: ${study.stack_ids?.length || 0} items`, study.stack_ids || 'none')
      }

    } catch (error) {
      console.error('❌ CRITICAL ERROR: Failed to load database files:', error)
      if (error instanceof SyntaxError) {
        console.error('💥 JSON Parsing Error - Check file syntax:', error.message)
      }
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
  console.log('🔍 Applying filters to case studies...')
  console.log('   - Input case studies:', caseStudies.length)
  console.log('   - Filters:', filters)

  let filteredStudies = [...caseStudies]

  const businessModel = filters.businessModel
  if (businessModel) {
    const beforeCount = filteredStudies.length
    filteredStudies = filteredStudies.filter(s =>
      s.business_model?.toLowerCase() === businessModel.toLowerCase()
    )
    console.log(`   ✅ Business model filter (${businessModel}): ${beforeCount} -> ${filteredStudies.length}`)
  }

  const persona = filters.persona
  if (persona) {
    const beforeCount = filteredStudies.length
    filteredStudies = filteredStudies.filter(s =>
      s.persona?.toLowerCase() === persona.toLowerCase()
    )
    console.log(`   ✅ Persona filter (${persona}): ${beforeCount} -> ${filteredStudies.length}`)
  }

  const impacts = filters.impacts
  if (impacts && Array.isArray(impacts)) {
    const beforeCount = filteredStudies.length
    filteredStudies = filteredStudies.filter(s => {
      const studyImpacts = s.glossary_keys?.impacts || []
      return impacts.some(impact =>
        studyImpacts.some((studyImpact: string) =>
          studyImpact.toLowerCase().includes(impact.toLowerCase()) ||
          impact.toLowerCase().includes(studyImpact.toLowerCase())
        )
      )
    })
    console.log(`   ✅ Impact filter (${impacts.join(', ')}): ${beforeCount} -> ${filteredStudies.length}`)
  }

  console.log(`📊 Final filtering result: ${caseStudies.length} -> ${filteredStudies.length} case studies`)

  if (filteredStudies.length > 0) {
    console.log('   📋 Filtered case study IDs:', filteredStudies.map(s => s.id))
  }

  return filteredStudies
}

// Helper function: Get Related Information
function getRelatedInformation(caseStudyIds: string[]) {
  console.log('🔍 Getting related information for case studies:', caseStudyIds)

  const database = loadDatabase()
  const relatedProducts: Product[] = []
  const relatedStack: Stack[] = []
  const missingProducts: string[] = []
  const missingStack: string[] = []

  // Get all unique product_ids and stack_ids from the selected case studies
  const productIds = new Set<string>()
  const stackIds = new Set<string>()

  console.log('📊 Analyzing case studies for linked data...')

  caseStudyIds.forEach(id => {
    const caseStudy = database.case_studies.find(cs => cs.id === id)
    if (caseStudy) {
      console.log(`   ✅ Found case study: ${id}`)
      console.log(`      - product_ids: ${caseStudy.product_ids?.length || 0}`, caseStudy.product_ids || 'none')
      console.log(`      - stack_ids: ${caseStudy.stack_ids?.length || 0}`, caseStudy.stack_ids || 'none')

      caseStudy.product_ids?.forEach(pid => productIds.add(pid))
      caseStudy.stack_ids?.forEach(sid => stackIds.add(sid))
    } else {
      console.log(`   ❌ Case study not found: ${id}`)
    }
  })

  console.log(`🎯 Unique product IDs to lookup: ${productIds.size}`, Array.from(productIds))
  console.log(`🎯 Unique stack IDs to lookup: ${stackIds.size}`, Array.from(stackIds))

  // Get related products
  console.log('🔍 Looking up products...')
  productIds.forEach(productId => {
    const product = database.products.find(p => p.id === productId)
    if (product) {
      console.log(`   ✅ Found product: ${productId} -> ${product.name}`)
      relatedProducts.push(product)
    } else {
      console.log(`   ❌ Product not found: ${productId}`)
      missingProducts.push(productId)
    }
  })

  // Get related stack
  console.log('🔍 Looking up stack technologies...')
  stackIds.forEach(stackId => {
    const stack = database.stack.find(s => s.id === stackId)
    if (stack) {
      console.log(`   ✅ Found stack: ${stackId} -> ${stack.name}`)
      relatedStack.push(stack)
    } else {
      console.log(`   ❌ Stack not found: ${stackId}`)
      missingStack.push(stackId)
    }
  })

  // Summary logging
  console.log('📈 Related information summary:')
  console.log(`   - Products found: ${relatedProducts.length}/${productIds.size}`)
  console.log(`   - Stack found: ${relatedStack.length}/${stackIds.size}`)

  if (missingProducts.length > 0) {
    console.log(`   ⚠️  Missing products: ${missingProducts.join(', ')}`)
  }
  if (missingStack.length > 0) {
    console.log(`   ⚠️  Missing stack: ${missingStack.join(', ')}`)
  }

  return {
    products: relatedProducts,
    stack: relatedStack
  }
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
      // Check if Azure was requested but not configured
      if (selectedModelType === 'azure') {
        const missingVars = []
        if (!azureApiKey) missingVars.push('AZURE_OPENAI_API_KEY')
        if (!azureEndpoint) missingVars.push('AZURE_OPENAI_ENDPOINT')
        if (!azureDeployment) missingVars.push('AZURE_OPENAI_DEPLOYMENT_NAME')

        if (missingVars.length > 0) {
          return `Azure OpenAI requested but missing environment variables: ${missingVars.join(', ')}. Please configure these in your .env.local file.`
        }
      }

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

// New endpoint for getting related products and stack information
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { case_study_ids } = body

    if (!case_study_ids || !Array.isArray(case_study_ids)) {
      return NextResponse.json(
        { error: 'Missing or invalid case_study_ids array in request body.' },
        { status: 400 }
      )
    }

    console.log('PATCH - Getting related info for case studies:', case_study_ids)

    const relatedInfo = getRelatedInformation(case_study_ids)

    console.log('PATCH - Related products found:', relatedInfo.products.length)
    console.log('PATCH - Related stack found:', relatedInfo.stack.length)

    return NextResponse.json({
      success: true,
      related_products: relatedInfo.products,
      related_stack: relatedInfo.stack,
      case_study_ids: case_study_ids
    })

  } catch (error: unknown) {
    console.error('Error in related info API:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal Server Error', message: errorMessage },
      { status: 500 }
    )
  }
}
