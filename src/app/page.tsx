import { Navigation } from '@/components/landing/navigation'
import { HeroSection } from '@/components/landing/hero-section'

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navigation />
      <HeroSection />
    </main>
  )
}