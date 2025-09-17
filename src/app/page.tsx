import { LandingNavigation } from '@/components/landing/navigation'
import { HeroSection } from '@/components/landing/hero-section'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-base">
      <LandingNavigation />
      <main>
        <HeroSection />
      </main>
    </div>
  )
}