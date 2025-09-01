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
              Adding subjects takes a lot of time. I aim to have all (popular) subjects 
              fully uploaded by October 1st.
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
          Why did I spend my summer building this website?
        </h2>
        <div className="prose prose-stone max-w-none">
          <p className="text-warm-text-secondary leading-relaxed font-serif text-xl">
            [This is placeholder text that you can replace with your personal story about why you built OSCO. 
            You might want to talk about your motivation, the problems you saw with existing resources, 
            your vision for helping students prepare for the Leaving Certificate, or any personal experiences 
            that inspired you to create this platform. This section gives your project a human touch and helps 
            users connect with the mission behind OSCO.]
          </p>
          <p className="text-warm-text-secondary leading-relaxed font-serif text-xl mt-4">
            [You could also discuss the technical challenges you overcame, the features you&apos;re most proud of, 
            or your future plans for the platform. This is your space to share your journey and passion for 
            education technology.]
          </p>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-stone-200 mb-12" />
      

    </DashboardPage>
  )
}