// Case Studies Data
export interface CaseStudy {
  id: string
  content_type: string
  customer_name: string
  title: string
  overview: string
  stats: Array<{
    label: string
    value: string
  }>
  industry: string
  business_model: string
  products: string[]
  persona: string
  logo?: string
  image_url?: string
  testimonial?: {
    quote: string
    author_name: string
    author_title: string
    author_company: string
  }
  glossary_keys: {
    impacts: string[]
    terms: string[]
  }
  [key: string]: unknown
}

// Export empty array - API loads from database.json
export const caseStudies: CaseStudy[] = []
