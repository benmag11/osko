import { DashboardPage } from '@/components/layout/dashboard-page'
import { SubjectList } from './components/subject-list'
import { FeatureChecklist } from './components/feature-checklist'

export default function AboutPage() {
  return (
    <DashboardPage maxWidth="max-w-4xl">
      {/* Hero Section */}
      <header className="pt-8 pb-16 md:pt-12 md:pb-20">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-warm-text-primary leading-tight tracking-tight">
          I spent 6th year complaining about Studyclix.
          <br />
          <span className="text-sky-600">So I built something better.</span>
        </h1>
      </header>

      {/* Divider */}
      <div className="w-16 h-px bg-stone-300 mb-16" />

      {/* Story Section */}
      <article className="mb-20">
        <div className="space-y-8">
          <p className="font-serif text-[1.375rem] md:text-[1.5rem] text-warm-text-secondary leading-[1.9]">
            I spent all of 6th year complaining that Studyclix was fairly shite for the 90 euro
            everyone paid for it, so I decided to put my time where my mouth was and built this.
          </p>
          <p className="font-serif text-[1.375rem] md:text-[1.5em] text-warm-text-secondary leading-[1.9]">
            I hope someone finds some usefulness in the literal hundreds of hours I have spent
            making this website. It will only get better, and I won&apos;t sell out.
          </p>
        </div>
      </article>

      {/* Subjects Section */}
      <section className="mb-20">
        <h2 className="font-serif text-3xl md:text-4xl text-warm-text-primary mb-10">
          Available Subjects
        </h2>
        <SubjectList />
      </section>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl md:text-4xl text-warm-text-primary mb-10">
          What&apos;s Next
        </h2>
        <FeatureChecklist />
      </section>

      {/* Footer Note */}
      <footer className="pt-8 pb-4 border-t border-stone-200">
        <p className="font-sans text-sm text-warm-text-muted">
          Built with late nights and too much coffee.
        </p>
      </footer>
    </DashboardPage>
  )
}
