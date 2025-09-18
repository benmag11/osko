import { LandingNavigation } from '@/components/landing/navigation'
import { HeroSection } from '@/components/landing/hero-section'
import { FeatureShowcase } from '@/components/landing/feature-showcase'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-base">
      <LandingNavigation />
      <main>
        <HeroSection />
        <FeatureShowcase />
      </main>
    </div>
  )
}