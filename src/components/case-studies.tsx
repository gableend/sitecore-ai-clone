'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useState, useEffect } from "react"

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

export function CaseStudies() {
  const [studies, setStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCaseStudies = async () => {
      try {
        const response = await fetch('/api/chat')
        const data = await response.json()

        if (data.success) {
          setStudies(data.case_studies)
        } else {
          setError('Failed to load case studies')
        }
      } catch (err) {
        setError('Error fetching case studies')
        console.error('Error fetching case studies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCaseStudies()
  }, [])

  if (loading) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-white text-lg">Loading case studies...</div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-red-400 text-lg">{error}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            All Case Studies
          </h2>
          <p className="text-gray-300 text-lg">
            Discover how organizations like yours achieve remarkable results
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studies && Array.isArray(studies) && studies.map((study, index) => (
            <Card
              key={study.id}
              className={`bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 ${
                index === 0 ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
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
                      {study.stats.slice(0, 3).map((stat, statIndex) => (
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
                      {study.products.map((product, productIndex) => (
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

                {/* Testimonial */}
                {study.testimonial && index === 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <blockquote className="text-gray-300 italic text-sm mb-3">
                      "{study.testimonial.quote}"
                    </blockquote>
                    <div className="text-white text-sm">
                      <div className="font-semibold">{study.testimonial.author_name}</div>
                      <div className="text-gray-400">{study.testimonial.author_title}</div>
                      <div className="text-gray-400">{study.testimonial.author_company}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
