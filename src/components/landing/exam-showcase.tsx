import Image from 'next/image'

export function ExamShowcase() {
  return (
    <section className="py-4 md:py-6">
      <div className="relative md:border-2 md:border-dashed md:border-gray-300 md:rounded-lg md:p-8">
        <Image
          src="/hero-image.webp"
          alt="Osko exam interface showing Mathematics questions with filters"
          width={1200}
          height={675}
          className="w-full h-auto rounded-lg shadow-lg"
          priority
        />
      </div>
    </section>
  )
}