'use client'

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  has_video?: boolean
  video_url?: string | null
  challenge?: {
    headline: string
    text: string
  } | null
  solution?: {
    headline: string
    text: string
  } | null
  outcome?: {
    headline: string
    text: string
  } | null
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

interface IntegratedCaseStudyExplorerProps {
  className?: string
}

export function IntegratedCaseStudyExplorer({ className }: IntegratedCaseStudyExplorerProps) {
  // Filter state
  const [selectedBusinessModels, setSelectedBusinessModels] = useState<string[]>([])
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])

  // Results and AI state
  const [filteredCaseStudies, setFilteredCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0)
  const cardsPerView = 1
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedModal, setSelectedModal] = useState<CaseStudy | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedStack, setSelectedStack] = useState<Stack | null>(null)

  // Related information state
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [relatedStack, setRelatedStack] = useState<Stack[]>([])
  const [relatedInfoLoading, setRelatedInfoLoading] = useState(false)

  // Filter options
  const businessModelOptions = ["B2B", "B2C", "Both"]
  const personaOptions = ["Marketing", "IT", "Business"]

  // Filter state calculations
  const totalFilters = selectedBusinessModels.length + selectedPersonas.length
  const hasFiltersApplied = totalFilters > 0

  // AI prompt pills based on current context
  const getContextualPrompts = () => {
    const studyCount = filteredCaseStudies.length

    if (totalFilters === 0) {
      return [
        "Show me the top performing case studies",
        "What industries are most represented?",
        "Which Sitecore products are most popular?"
      ]
    }

    const prompts = []

    if (selectedBusinessModels.length > 0) {
      prompts.push(`What are the key success patterns in ${selectedBusinessModels.join(' and ')} businesses?`)
    }

    if (selectedPersonas.length > 0) {
      prompts.push(`What should ${selectedPersonas.join(' and ')} professionals focus on?`)
    }

    if (studyCount > 0) {
      prompts.push(`Compare these ${studyCount} case studies for me`)
      prompts.push("What are the common success factors?")
    }

    return prompts.slice(0, 4) // Limit to 4 contextual prompts
  }

  // Toggle functions
  const toggleBusinessModel = (model: string) => {
    setSelectedBusinessModels(prev =>
      prev.includes(model) ? [] : [model]
    )
  }

  const togglePersona = (persona: string) => {
    setSelectedPersonas(prev =>
      prev.includes(persona) ? [] : [persona]
    )
  }

  // Carousel navigation functions
  const nextSlide = useCallback(() => {
    if (filteredCaseStudies.length === 0) return
    setCurrentIndex(prev => (prev + 1) % filteredCaseStudies.length)
  }, [filteredCaseStudies.length])

  const prevSlide = useCallback(() => {
    if (filteredCaseStudies.length === 0) return
    setCurrentIndex(prev => {
      const newIndex = prev - 1
      return newIndex < 0 ? filteredCaseStudies.length - 1 : newIndex
    })
  }, [filteredCaseStudies.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Reset carousel when filters change
  const resetCarousel = () => {
    setCurrentIndex(0)
  }

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
  }

  // Modal handlers
  const openModal = (study: CaseStudy) => {
    setSelectedModal(study)
    setIsPaused(true) // Pause auto-play when modal opens
  }

  const closeModal = () => {
    setSelectedModal(null)
    setIsPaused(false) // Resume auto-play when modal closes
  }

  // Product modal handlers
  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
  }

  // Stack modal handlers
  const openStackModal = (stack: Stack) => {
    setSelectedStack(stack)
  }

  const closeStackModal = () => {
    setSelectedStack(null)
  }

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <Card className="group bg-white/10 border-white/20 backdrop-blur-sm overflow-hidden flex-shrink-0 w-full max-w-sm animate-pulse">
      <div className="relative h-48 bg-gradient-to-br from-gray-700/20 to-gray-600/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="h-6 w-16 bg-gray-500/30 rounded"></div>
          <div className="h-6 w-12 bg-gray-500/30 rounded"></div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="h-6 w-3/4 bg-gray-500/30 rounded"></div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-500/30 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-500/30 rounded"></div>
        </div>
      </CardContent>
    </Card>
  )

  // AI prompt handler with streaming
  const handleAIPrompt = async (prompt: string) => {
    setAiLoading(true)
    setAiResponse('')

    try {
      const filters = {
        businessModel: selectedBusinessModels[0] || undefined,
        persona: selectedPersonas[0] || undefined
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: prompt,
          selectedModelType: 'azure',
          filters
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let accumulatedResponse = ''
      setAiLoading(false) // Start showing content immediately

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // Parse streaming chunks properly - look for data: lines
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Extract content from streaming format like: 0:"text content"
            const match = line.match(/^0:"(.+?)"$/)
            if (match) {
              // Decode escaped characters
              const content = match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
              accumulatedResponse += content
              setAiResponse(accumulatedResponse)
            }
          }
        }
      }
    } catch (err) {
      setAiLoading(false)
      setAiResponse('Sorry, I encountered an error processing your request.')
      console.error('Error calling AI:', err)
    }
  }

  // Fetch related products and stack information
  const fetchRelatedInformation = useCallback(async (caseStudyIds: string[]) => {
    if (caseStudyIds.length === 0) {
      setRelatedProducts([])
      setRelatedStack([])
      return
    }

    setRelatedInfoLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_study_ids: caseStudyIds
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRelatedProducts(data.related_products || [])
        setRelatedStack(data.related_stack || [])
      } else {
        console.error('Failed to fetch related information:', data.error)
        setRelatedProducts([])
        setRelatedStack([])
      }
    } catch (err) {
      console.error('Error fetching related information:', err)
      setRelatedProducts([])
      setRelatedStack([])
    } finally {
      setRelatedInfoLoading(false)
    }
  }, [])

  // Fetch filtered case studies from API
  useEffect(() => {
    const fetchFilteredCaseStudies = async () => {
      setLoading(true)
      setError(null)

      try {
        const filters: {
          businessModel?: string
          persona?: string
          impacts?: string[]
        } = {}

        if (selectedBusinessModels.length > 0) {
          filters.businessModel = selectedBusinessModels[0]
        }

        if (selectedPersonas.length > 0) {
          filters.persona = selectedPersonas[0]
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
          resetCarousel() // Reset carousel when new data loads
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
  }, [selectedBusinessModels, selectedPersonas])

  // Fetch related information when filtered case studies change
  useEffect(() => {
    const caseStudyIds = filteredCaseStudies.map(study => study.id)
    fetchRelatedInformation(caseStudyIds)
  }, [filteredCaseStudies, fetchRelatedInformation])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedModal) return // Don't navigate when modal is open

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          prevSlide()
          break
        case 'ArrowRight':
          event.preventDefault()
          nextSlide()
          break
        case 'Escape':
          setSelectedModal(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedModal, nextSlide, prevSlide])

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay || isPaused || filteredCaseStudies.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredCaseStudies.length)
    }, 3333) // Auto-advance every 3.3 seconds (50% faster)

    return () => clearInterval(interval)
  }, [isAutoPlay, isPaused, filteredCaseStudies.length])

  return (
    <div className={className}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Explore Case Studies
          </h2>
          <p className="text-gray-300 text-lg">
            Filter, discover insights, and learn from successful implementations
          </p>
        </div>

        {/* Integrated Container */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {/* Filter Section */}
          <div className="p-8 border-b border-white/10">
            {/* Top Row: Business Model & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Business Model */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Filter by customer business model</h3>
                <div className="grid grid-cols-3 gap-3">
                  {businessModelOptions.map((model) => (
                    <button
                      key={model}
                      onClick={() => toggleBusinessModel(model)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        selectedBusinessModels.includes(model)
                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/25'
                          : 'bg-white/5 text-gray-300 border-white/20 hover:bg-white/10 hover:text-white hover:border-white/30'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>

              {/* Your Role */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Filter by testimonial role</h3>
                <div className="grid grid-cols-3 gap-3">
                  {personaOptions.map((persona) => (
                    <button
                      key={persona}
                      onClick={() => togglePersona(persona)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        selectedPersonas.includes(persona)
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25'
                          : 'bg-white/5 text-gray-300 border-white/20 hover:bg-white/10 hover:text-white hover:border-white/30'
                      }`}
                    >
                      {persona}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear filters */}
            {totalFilters > 0 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                <div className="text-sm text-gray-400">
                  {totalFilters} filter{totalFilters > 1 ? 's' : ''} active • {loading ? 'Loading...' : `${filteredCaseStudies.length} results found`}
                </div>
                <button
                  onClick={() => {
                    setSelectedBusinessModels([])
                    setSelectedPersonas([])
                    setAiResponse('')
                  }}
                  className="text-purple-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Results Section */}
          {hasFiltersApplied ? (
            <div className="p-8 border-b border-white/10">
              {loading && (
                <div className="relative">
                  {/* Loading Skeleton */}
                  <div className="overflow-hidden mx-12">
                    <div className="flex gap-6">
                      {[...Array(3)].map((_, index) => (
                        <SkeletonCard key={`skeleton-${index}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-center mt-6">
                    <div className="text-white/70 text-sm">Loading case studies...</div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <div className="text-red-400 text-lg">{error}</div>
                </div>
              )}

              {!loading && !error && (
                <>
                  {/* Case Studies Display */}
                  {filteredCaseStudies.length > 0 ? (
                    <>
                      {/* Case Studies Carousel */}
                      <div
                        className="relative"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                      >
                        {/* Navigation Arrows */}
                        {filteredCaseStudies.length > 1 && (
                          <>
                            <button
                              onClick={prevSlide}
                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full p-3 transition-all duration-200 hover:scale-110"
                              aria-label="Previous case studies"
                            >
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={nextSlide}
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full p-3 transition-all duration-200 hover:scale-110"
                              aria-label="Next case studies"
                            >
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </>
                        )}

                        {/* Carousel Container */}
                        <div className="overflow-hidden mx-12">
                          <div
                            className="flex transition-transform duration-500 ease-in-out gap-6"
                            style={{ transform: `translateX(-${currentIndex * (100/3)}%)` }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
                            {filteredCaseStudies && Array.isArray(filteredCaseStudies) && filteredCaseStudies.map((study) => {
                              return (
                                <Card
                                  key={study.id}
                                  className="group bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 overflow-hidden cursor-pointer flex-shrink-0 w-1/3 max-w-sm hover:scale-105"
                                  onClick={() => openModal(study)}
                                >
                                  {/* Background Image Section */}
                                  <div
                                    className="relative h-48 bg-gradient-to-br from-purple-600/20 to-blue-600/20"
                                    style={{
                                      backgroundImage: study.image_url ? `url(${study.image_url})` : undefined,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      backgroundRepeat: 'no-repeat'
                                    }}
                                  >
                                    {/* Overlay for text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>

                                    {/* Top badges */}
                                    <div className="absolute top-4 left-4 right-4 flex flex-wrap items-start gap-2 z-10">
                                      {/* Business Model Badges */}
                                      {study.business_model === 'Both' ? (
                                        <>
                                          <Badge
                                            variant="outline"
                                            className={`backdrop-blur-sm text-white border transition-all duration-200 text-xs ${
                                              selectedBusinessModels.includes('B2B')
                                                ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-600/25 ring-1 ring-purple-400/50'
                                                : 'bg-purple-600/40 border-purple-500/40'
                                            }`}
                                          >
                                            B2B
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className={`backdrop-blur-sm text-white border transition-all duration-200 text-xs ${
                                              selectedBusinessModels.includes('B2C')
                                                ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-600/25 ring-1 ring-purple-400/50'
                                                : 'bg-purple-600/40 border-purple-500/40'
                                            }`}
                                          >
                                            B2C
                                          </Badge>
                                        </>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className={`backdrop-blur-sm text-white border transition-all duration-200 text-xs ${
                                            selectedBusinessModels.includes(study.business_model)
                                              ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-600/25 ring-1 ring-purple-400/50'
                                              : 'bg-purple-600/40 border-purple-500/40'
                                          }`}
                                        >
                                          {study.business_model}
                                        </Badge>
                                      )}

                                      {/* Industry Badge */}
                                      <Badge
                                        variant="outline"
                                        className="backdrop-blur-sm text-white border bg-green-600/40 border-green-500/40 transition-all duration-200 text-xs"
                                      >
                                        {study.industry}
                                      </Badge>

                                      {/* Persona Badge */}
                                      <Badge
                                        variant="outline"
                                        className={`backdrop-blur-sm text-white border transition-all duration-200 text-xs ${
                                          selectedPersonas.includes(study.persona)
                                            ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/25 ring-1 ring-blue-400/50'
                                            : 'bg-blue-600/20 border-blue-200/30'
                                        }`}
                                      >
                                        {study.persona}
                                      </Badge>
                                    </div>

                                    {/* Customer Name at bottom */}
                                    <div className="absolute bottom-4 left-4 right-4 z-10">
                                      <h3 className="text-white text-lg font-bold leading-tight drop-shadow-lg">
                                        {study.customer_name}
                                      </h3>
                                    </div>

                                    {/* Video indicator badge */}
                                    {study.has_video && (
                                      <div className="absolute bottom-4 right-4 z-10">
                                        <Badge className="bg-red-600 text-white border-red-500 backdrop-blur-sm text-xs">
                                          VIDEO
                                        </Badge>
                                      </div>
                                    )}

                                    {/* Click to view indicator */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                                        {study.has_video ? (
                                          <svg className="w-6 h-6 text-purple-700" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        ) : (
                                          <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Content */}
                                  <CardContent className="p-4">
                                    {/* Testimonial Quote */}
                                    {study.testimonial && (
                                      <blockquote className="text-gray-300 italic text-sm line-clamp-3">
                                        "{study.testimonial.quote}"
                                      </blockquote>
                                    )}
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        </div>

                        {/* Navigation Dots with Auto-play Controls */}
                        {filteredCaseStudies.length > 1 && (
                          <div className="flex justify-center items-center gap-4 mt-6">
                            <div className="flex space-x-2">
                              {filteredCaseStudies.map((_, index) => {
                                const isActive = currentIndex === index
                                return (
                                  <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                      isActive
                                        ? 'bg-purple-500 scale-110'
                                        : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                    aria-label={`Go to case study ${index + 1}`}
                                  />
                                )
                              })}
                            </div>

                            {/* Auto-play Controls */}
                            <button
                              onClick={() => setIsAutoPlay(!isAutoPlay)}
                              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full p-2 transition-all duration-200"
                              aria-label={isAutoPlay ? 'Pause auto-play' : 'Start auto-play'}
                            >
                              {isAutoPlay ? (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.691-2.611C4.785 10.766 3 8.84 3 6.5A3.5 3.5 0 016.5 3c1.061 0 2.004.471 2.654 1.217A4.977 4.977 0 0112 3c.93 0 1.804.208 2.592.576A3.5 3.5 0 0117.5 3 3.5 3.5 0 0121 6.5c0 2.34-1.785 4.266-3.309 5.889A7.962 7.962 0 0112 15z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No case studies found</h3>
                      <p className="text-gray-400 mb-4">
                        Try adjusting your filters to see more results.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedBusinessModels([])
                          setSelectedPersonas([])
                          setAiResponse('')
                        }}
                        className="text-purple-300 hover:text-white underline transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="p-8 border-b border-white/10">
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to explore case studies?</h3>
                <p className="text-gray-400 mb-4">
                  Apply filters above to discover relevant Sitecore customer success stories and get AI-powered insights.
                </p>
                <p className="text-gray-500 text-sm">
                  Filter by business model and testimonial role to get started.
                </p>
              </div>
            </div>
          )}

          {/* Split Insights Section */}
          {hasFiltersApplied && (
            <div className="p-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* AI Insights Section - 66% width */}
                <div className="lg:col-span-2">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">AI Insights</h3>
                    <p className="text-gray-400 text-sm">Get intelligent analysis based on your current selection</p>
                  </div>

                  {/* Contextual AI Prompts */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white mb-4">Quick AI Analysis:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getContextualPrompts().map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleAIPrompt(prompt)}
                          disabled={aiLoading}
                          className="group relative px-5 py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 border border-purple-500/30 hover:border-purple-400 rounded-lg text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium group-hover:text-purple-100">
                              {prompt}
                            </span>
                            <svg
                              className="w-4 h-4 text-purple-300 group-hover:text-purple-200 opacity-60"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Response */}
                  {(aiResponse || aiLoading) && (
                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-600/30 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-purple-300 text-sm font-medium">AI Analysis</span>
                      </div>
                      {aiLoading && !aiResponse ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span className="text-gray-300">Analyzing your case studies...</span>
                        </div>
                      ) : (
                        <div className="relative">
                          {aiLoading && aiResponse && (
                            <div className="absolute top-0 right-0 flex items-center space-x-2 bg-purple-600/20 rounded-full px-3 py-1 border border-purple-600/30">
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                              <span className="text-purple-300 text-xs">Streaming...</span>
                            </div>
                          )}
                          <div className="prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({children}) => <h1 className="text-lg font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-semibold text-white mb-2 mt-3">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-semibold text-white mb-2 mt-2">{children}</h3>,
                                p: ({children}) => <p className="text-gray-200 mb-3 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="text-gray-200 mb-3 ml-4 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="text-gray-200 mb-3 ml-4 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-gray-200">{children}</li>,
                                strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                                em: ({children}) => <em className="text-purple-200">{children}</em>,
                                code: ({children}) => <code className="bg-slate-800 text-purple-200 px-1 py-0.5 rounded text-xs">{children}</code>,
                                pre: ({children}) => <pre className="bg-slate-800 p-3 rounded text-xs overflow-x-auto mb-3">{children}</pre>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 mb-3">{children}</blockquote>
                              }}
                            >
                              {aiResponse}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Discover More Section - 34% width */}
                <div className="lg:col-span-1">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Discover More</h3>
                    <p className="text-gray-400 text-sm">Related products and technology stack</p>
                  </div>

                  {relatedInfoLoading ? (
                    <div className="space-y-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Related Products */}
                      {relatedProducts.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3">Related Products</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {relatedProducts.map((product) => (
                              <button
                                key={product.id}
                                onClick={() => openProductModal(product)}
                                className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-600/20 rounded-lg p-3 hover:from-green-600/20 hover:to-emerald-600/20 hover:border-green-600/40 transition-all duration-200 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={product.Logo}
                                    alt={product.name}
                                    className="w-6 h-6 object-contain flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <h5 className="text-white text-xs font-medium leading-tight truncate">
                                    {product.name}
                                  </h5>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Tech Stack */}
                      {relatedStack.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3">Tech Stack</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {relatedStack.map((stack) => (
                              <button
                                key={stack.id}
                                onClick={() => openStackModal(stack)}
                                className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-600/20 rounded-lg p-3 hover:from-blue-600/20 hover:to-cyan-600/20 hover:border-blue-600/40 transition-all duration-200 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg flex-shrink-0">{stack.logo}</span>
                                  <h5 className="text-white text-xs font-medium leading-tight truncate">
                                    {stack.name}
                                  </h5>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {relatedProducts.length === 0 && relatedStack.length === 0 && filteredCaseStudies.length > 0 && (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-8 h-8 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-sm">No related products or stack information available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case Study Modal */}
      {selectedModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative">
              <div
                className="h-64 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-t-xl"
                style={{
                  backgroundImage: selectedModal.image_url ? `url(${selectedModal.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 rounded-t-xl"></div>

                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  <Badge variant="secondary" className="bg-black/70 text-white border-white/20 backdrop-blur-sm">
                    {selectedModal.content_type}
                  </Badge>

                  {/* Video Badge */}
                  {selectedModal.has_video && (
                    <Badge variant="secondary" className="bg-red-600 text-white border-red-500 backdrop-blur-sm">
                      VIDEO
                    </Badge>
                  )}

                  {/* Business Model Badges */}
                  {selectedModal.business_model === 'Both' ? (
                    <>
                      <Badge
                        variant="outline"
                        className="bg-purple-600 text-white border-purple-500 backdrop-blur-sm"
                      >
                        B2B
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-purple-600 text-white border-purple-500 backdrop-blur-sm"
                      >
                        B2C
                      </Badge>
                    </>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-purple-600 text-white border-purple-500 backdrop-blur-sm"
                    >
                      {selectedModal.business_model}
                    </Badge>
                  )}

                  {/* Industry Badge */}
                  <Badge
                    variant="outline"
                    className="bg-green-600 text-white border-green-500 backdrop-blur-sm"
                  >
                    {selectedModal.industry}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="bg-blue-600 text-white border-blue-500 backdrop-blur-sm"
                  >
                    {selectedModal.persona}
                  </Badge>
                </div>

                {/* Header Content */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                    {selectedModal.title}
                  </h2>
                  <p className="text-lg text-white/90 font-semibold drop-shadow-lg">
                    {selectedModal.customer_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Video Player */}
              {selectedModal.has_video && selectedModal.video_url && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Video</h3>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                    <video
                      controls
                      className="w-full h-full"
                      poster={selectedModal.image_url || undefined}
                    >
                      <source src={selectedModal.video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {/* Overview */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Overview</h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedModal.overview}
                </p>
              </div>

              {/* Challenge */}
              {selectedModal.challenge && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Challenge</h3>
                  <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-red-200 mb-3">{selectedModal.challenge.headline}</h4>
                    <p className="text-gray-300 leading-relaxed">{selectedModal.challenge.text}</p>
                  </div>
                </div>
              )}

              {/* Solution */}
              {selectedModal.solution && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Solution</h3>
                  <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-blue-200 mb-3">{selectedModal.solution.headline}</h4>
                    <p className="text-gray-300 leading-relaxed">{selectedModal.solution.text}</p>
                  </div>
                </div>
              )}

              {/* Outcome */}
              {selectedModal.outcome && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Outcome</h3>
                  <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-green-200 mb-3">{selectedModal.outcome.headline}</h4>
                    <p className="text-gray-300 leading-relaxed">{selectedModal.outcome.text}</p>
                  </div>
                </div>
              )}

              {/* Key Stats */}
              {selectedModal.stats && Array.isArray(selectedModal.stats) && selectedModal.stats.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Key Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedModal.stats.map((stat, statIndex) => (
                      <div key={`modal-stat-${statIndex}`} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-purple-300 font-bold text-2xl mb-1">
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
              {selectedModal.products && Array.isArray(selectedModal.products) && selectedModal.products.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Sitecore Products Used</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedModal.products.map((product, productIndex) => (
                      <Badge
                        key={`modal-product-${productIndex}`}
                        variant="outline"
                        className="border-purple-400/30 text-purple-200 px-3 py-1"
                      >
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Impact Areas */}
              {selectedModal.glossary_keys?.impacts && Array.isArray(selectedModal.glossary_keys.impacts) && selectedModal.glossary_keys.impacts.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Impact Areas</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedModal.glossary_keys.impacts.map((impact, impactIndex) => (
                      <Badge
                        key={`modal-impact-${impactIndex}`}
                        variant="secondary"
                        className="bg-green-600/20 text-green-200 border-green-600/30 px-3 py-1"
                      >
                        {impact}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonial */}
              {selectedModal.testimonial && (
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Customer Testimonial</h3>
                  <blockquote className="text-gray-300 italic text-lg mb-4 leading-relaxed">
                    "{selectedModal.testimonial.quote}"
                  </blockquote>
                  <div className="text-white">
                    <div className="font-semibold text-lg">{selectedModal.testimonial.author_name}</div>
                    <div className="text-gray-300">{selectedModal.testimonial.author_title}</div>
                    <div className="text-gray-300">{selectedModal.testimonial.author_company}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeProductModal}
        >
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={closeProductModal}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header Content */}
              <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={selectedProduct.Logo}
                    alt={selectedProduct.name}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <h2 className="text-2xl font-bold text-white">
                    {selectedProduct.name}
                  </h2>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 pt-0">
              {/* Video Player */}
              {selectedProduct.video_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Product Video</h3>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                    <video
                      controls
                      className="w-full h-full"
                      poster={selectedProduct.Logo}
                    >
                      <source src={selectedProduct.video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">About this Product</h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <Button
                  onClick={closeProductModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                >
                  Learn More on Sitecore.com
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stack Detail Modal */}
      {selectedStack && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeStackModal}
        >
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={closeStackModal}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header Content */}
              <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">
                    {selectedStack.logo}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedStack.name}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="border-blue-600/30 text-blue-200">
                        {selectedStack.category}
                      </Badge>
                      <Badge variant="outline" className="border-cyan-600/30 text-cyan-200">
                        {selectedStack.type}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600/30 text-gray-200">
                        {selectedStack.vendor}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 pt-0">
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">About {selectedStack.name}</h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedStack.description}
                </p>
              </div>

              {/* DXP Integration */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Integration with Digital Experience Platform</h3>
                <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-600/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300 leading-relaxed">
                      {selectedStack.primary_use}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <Button
                  onClick={closeStackModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  Learn More About {selectedStack.vendor}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
