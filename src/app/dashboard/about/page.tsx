import { DashboardPage } from '@/components/layout/dashboard-page'
import { SubjectStatusTable } from './components/subject-status-table'
import { FutureFeaturesTimeline } from './components/future-features-timeline'

export default function AboutPage() {
  return (
    <DashboardPage maxWidth="max-w-6xl">
      {/* Main Header */}
      <div className="mb-12">
        <h1 className="text-7xl font-serif font-normal text-warm-text-secondary mb-4">
          Some Information About Osko.
        </h1>
      </div>

      {/* Divider */}
      <hr className="border-stone-200 mb-12" />
      
      {/* Available Subjects Section */}
      <section className="mb-12">
        <div className="text-center mb-6">
          <h2 className="text-5xl font-sans font-semibold text-stone-800 mb-6">
            Available Subjects
          </h2>
          <div className="prose prose-stone max-w-3xl mx-auto">
            <p className="text-warm-text-secondary leading-relaxed font-serif text-xl">
              Adding subjects takes a lot of time. All (popular) subjects 
              fully uploaded by <b><i>October 10th</i></b>.
            </p>
          </div>
        </div>
        <SubjectStatusTable />
      </section>

      {/* Divider */}
      <hr className="border-stone-200 mb-12" />
      
      {/* Future Features Timeline */}
      <FutureFeaturesTimeline />
      
      {/* Divider */}
      <hr className="border-stone-200 mb-12" />
      
      {/* Why I Built This Section */}
      <section className="mb-12">
        <h2 className="text-4xl font-sans font-semibold text-stone-800 mb-6">
          Why this website exists?
        </h2>
        <div className="prose prose-stone max-w-none">
          <p className="text-warm-text-secondary leading-relaxed font-serif text-xl">
            I spent all of 6th year complaining that Studyclix was fairly shite for the 90 euro everyone paid for it, so decided to put my time where my mouth was and built this.
          </p>
      
          <p className="text-warm-text-secondary leading-relaxed font-serif text-xl mt-4">
            I hope someone finds some usefulness in the literal hundreds of hours I have spent making this website, it will only get better, and I won&apos;t sell out (for a while anyways).
          </p>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-stone-200 mb-12" />
      

    </DashboardPage>
  )
}