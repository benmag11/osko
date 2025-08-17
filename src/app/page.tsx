import { LandingNavigation } from '@/components/landing/navigation'
import { HeroSection } from '@/components/landing/hero-section'
import { ExamShowcase } from '@/components/landing/exam-showcase'
import { CTASection } from '@/components/landing/cta-section'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavigation />
      <main className="container mx-auto px-4">
        <HeroSection />
        <ExamShowcase />
        <CTASection />
      </main>
    </div>
  )
}