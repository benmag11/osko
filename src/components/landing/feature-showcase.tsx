import Image from 'next/image'

export function FeatureShowcase() {
  return (
    <section className="pt-6 pb-12 md:pt-8 md:pb-16 lg:pt-10 lg:pb-20 px-4 md:px-6">
      <div className="container mx-auto max-w-screen-2xl">
        {/* Feature container with cream background */}
        <div
          className="rounded-2xl px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-16"
          style={{ backgroundColor: '#FFFDFC' }}
        >
          {/* Heading */}
          <h2 className="font-serif font-semibold text-warm-text-primary text-5xl md:text-6xl lg:text-7xl text-center mb-4">
            Find any question
          </h2>

          {/* Subheading with mascot emoji */}
          <p className="font-sans text-warm-text-secondary text-xl md:text-2xl lg:text-3xl text-center mb-4 md:mb-5 lg:mb-6">
            And through a cleaner interface...?
          </p>

          {/* Image container */}
          <div className="relative w-full max-w-6xl mx-auto">
            <div className="relative rounded-lg overflow-hidden border border-stone-400 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
              <Image
                src="/exam-viewer.webp"
                alt="Exam viewer interface showing question filtering and search functionality"
                width={1920}
                height={1080}
                priority
                className="w-full h-auto"
                quality={85}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}