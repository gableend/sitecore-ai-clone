'use client'

import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { PillQuestionnaire } from "@/components/pill-questionnaire"
import { CaseStudies } from "@/components/case-studies"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <PillQuestionnaire />

      <div id="all-case-studies">
        <CaseStudies />
      </div>
    </main>
  );
}
