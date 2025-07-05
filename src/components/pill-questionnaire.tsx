'use client'

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface CaseStudy {
  id: string
  content_type: string
  customer_name: string
  title: string
  overview: string
  stats?: Array<{
    label: string
    value: string | null
  }> | null
  industry: string
  business_model: string
  products?: string[] | null
  persona: string
  logo?: string | null
  image_url?: string | null
  testimonial?: {
    quote: string
    author_name: string
    author_title: string
    author_company: string
  } | null
  glossary_keys?: {
    impacts?: string[] | null
    terms?: string[] | null
  } | null
}

interface PillQuestionnaireProps {
  className?: string
}

export function PillQuestionnaire({ className }: PillQuestionnaireProps) {
  // Filter state
  const [selectedBusinessModels, setSelectedBusinessModels] = useState<string[]>([])
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>([])

  // Results state
  const [filteredCaseStudies, setFilteredCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter options
  const businessModelOptions = ["B2B", "B2C", "Both"]
  const personaOptions = ["Marketing", "IT", "Business"]
  const impactOptions = [
    "Revenue Growth",
    "Performance Improvement",
    "Time to Market / Efficiency",
    "Cost Reduction",
    "Audience Engagement",
    "Operational Consolidation"
  ]

  // Toggle functions
  const toggleBusinessModel = (model: string) => {
    setSelectedBusinessModels(prev =>
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    )
  }

  const togglePersona = (persona: string) => {
    setSelectedPersonas(prev =>
      prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona]
    )
  }

  const toggleImpact = (impact: string) => {
    setSelectedImpacts(prev =>
      prev.includes(impact)
        ? prev.filter(i => i !== impact)
        : [...prev, impact]
    )
  }

  // Fetch filtered case studies from API
  useEffect(() => {
    const fetchFilteredCaseStudies = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build filters object
        const filters: {
          businessModel?: string
          persona?: string
          impacts?: string[]
        } = {}

        if (selectedBusinessModels.length > 0) {
          filters.businessModel = selectedBusinessModels[0] // API expects single value
        }

        if (selectedPersonas.length > 0) {
          filters.persona = selectedPersonas[0] // API expects single value
        }

        if (selectedImpacts.length > 0) {
          filters.impacts = selectedImpacts
        }

        const response = await fetch('/api/chat', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filters }),
        })

        const data = await response.json()

        if (data.success) {
          setFilteredCaseStudies(data.case_studies)
        } else {
          setError('Failed to load case studies')
        }
      } catch (err) {
        setError('Error fetching case studies')
        console.error('Error fetching filtered case studies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFilteredCaseStudies()
  }, [selectedBusinessModels, selectedPersonas, selectedImpacts])

  const totalFilters = selectedBusinessModels.length + selectedPersonas.length + selectedImpacts.length

  return (
    <div className={className}>
      {/* Filter Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Find Relevant Case Studies
            </h2>
            <p className="text-gray-300 text-lg">
              Select filters below to discover case studies that match your needs
            </p>
            <p className="text-purple-300 mt-2">
              {loading ? 'Loading...' : `${filteredCaseStudies.length} case studies found`}
              {totalFilters > 0 && ` • ${totalFilters} filters active`}
            </p>
          </div>

          {/* Three Column Pills */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Business Model Column */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Business Model</h3>
              <div className="flex flex-wrap gap-3">
                {businessModelOptions.map((model) => (
                  <button
                    key={model}
                    onClick={() => toggleBusinessModel(model)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedBusinessModels.includes(model)
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400/50 shadow-lg'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* Persona Column */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Your Role</h3>
              <div className="flex flex-wrap gap-3">
                {personaOptions.map((persona) => (
                  <button
                    key={persona}
                    onClick={() => togglePersona(persona)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedPersonas.includes(persona)
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400/50 shadow-lg'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {persona}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Areas Column */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Desired Outcomes</h3>
              <div className="flex flex-wrap gap-3">
                {impactOptions.map((impact) => (
                  <button
                    key={impact}
                    onClick={() => toggleImpact(impact)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedImpacts.includes(impact)
                        ? 'bg-green-600 text-white ring-2 ring-green-400/50 shadow-lg'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {impact}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear All Filters Button */}
          {totalFilters > 0 && (
            <div className="text-center mb-8">
              <button
                onClick={() => {
                  setSelectedBusinessModels([])
                  setSelectedPersonas([])
                  setSelectedImpacts([])
                }}
                className="text-gray-400 hover:text-white text-sm underline transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              {totalFilters > 0 ? 'Filtered Case Studies' : 'All Case Studies'}
            </h2>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="text-white text-lg">Loading case studies...</div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-400 text-lg">{error}</div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Case Studies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCaseStudies && Array.isArray(filteredCaseStudies) && filteredCaseStudies.map((study) => (
                  <Card
                    key={study.id}
                    className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary" className="bg-purple-600/20 text-purple-200">
                          {study.content_type}
                        </Badge>
                        <Badge variant="outline" className="border-white/30 text-white">
                          {study.business_model}
                        </Badge>
                      </div>

                      {study.logo && (
                        <div className="mb-4">
                          <Image
                            src={study.logo}
                            alt={`${study.customer_name} logo`}
                            width={120}
                            height={40}
                            className="h-10 w-auto object-contain"
                          />
                        </div>
                      )}

                      <CardTitle className="text-white text-xl leading-tight">
                        {study.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                        {study.overview}
                      </p>

                      {/* Key Stats */}
                      {study.stats && Array.isArray(study.stats) && study.stats.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-white font-semibold mb-3">Key Results</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {study.stats.slice(0, 2).map((stat, statIndex) => (
                              <div key={`${study.id}-stat-${statIndex}-${stat.label}`} className="bg-white/5 rounded-lg p-3">
                                <div className="text-purple-300 font-bold text-lg">
                                  {stat.value}
                                </div>
                                <div className="text-gray-400 text-sm">
                                  {stat.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products Used */}
                      {study.products && Array.isArray(study.products) && study.products.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-white font-semibold mb-2 text-sm">Products</h4>
                          <div className="flex flex-wrap gap-2">
                            {study.products.slice(0, 3).map((product, productIndex) => (
                              <Badge
                                key={`${study.id}-product-${productIndex}-${product}`}
                                variant="outline"
                                className="border-purple-400/30 text-purple-200 text-xs"
                              >
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Impact Categories */}
                      {study.glossary_keys?.impacts && Array.isArray(study.glossary_keys.impacts) && study.glossary_keys.impacts.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-white font-semibold mb-2 text-sm">Impact Areas</h4>
                          <div className="flex flex-wrap gap-2">
                            {study.glossary_keys.impacts.map((impact, impactIndex) => (
                              <Badge
                                key={`${study.id}-impact-${impactIndex}-${impact}`}
                                variant="secondary"
                                className="bg-green-600/20 text-green-200 text-xs"
                              >
                                {impact}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredCaseStudies.length === 0 && totalFilters > 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.691-2.611C4.785 10.766 3 8.84 3 6.5A3.5 3.5 0 016.5 3c1.061 0 2.004.471 2.654 1.217A4.977 4.977 0 0112 3c.93 0 1.804.208 2.592.576A3.5 3.5 0 0117.5 3 3.5 3.5 0 0121 6.5c0 2.34-1.785 4.266-3.309 5.889A7.962 7.962 0 0112 15z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No case studies found</h3>
                  <p className="text-gray-400 mb-4">
                    Try adjusting your filters or clearing them to see more results.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedBusinessModels([])
                      setSelectedPersonas([])
                      setSelectedImpacts([])
                    }}
                    className="text-purple-300 hover:text-white underline transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
