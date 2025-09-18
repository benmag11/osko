import Image from 'next/image'

export function FeatureShowcase() {
  return (
    <section className="py-20 md:py-28 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Feature container with cream background */}
        <div
          className="rounded-2xl px-8 py-16 md:px-12 md:py-20 lg:px-16 lg:py-24"
          style={{ backgroundColor: '#FFFDFC' }}
        >
          {/* Heading */}
          <h2 className="font-serif font-semibold text-warm-text-primary text-5xl md:text-6xl lg:text-7xl text-center mb-4">
            Find any question
          </h2>

          {/* Subheading with mascot emoji */}
          <p className="font-sans text-warm-text-secondary text-xl md:text-2xl lg:text-3xl text-center mb-12 md:mb-16">
            (And through an actually nice user interface ...) 🐹
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