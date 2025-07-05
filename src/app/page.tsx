'use client'

import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { IntegratedCaseStudyExplorer } from "@/components/integrated-case-study-explorer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <IntegratedCaseStudyExplorer />
    </main>
  );
}
