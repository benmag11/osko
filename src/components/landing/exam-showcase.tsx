import Image from 'next/image'

export function ExamShowcase() {
  return (
    <section className="py-4 md:py-6">
      <div className="relative md:rounded-lg md:p-8">
        <Image
          src="/hero-image.webp"
          alt="Osko exam interface showing Mathematics questions with filters"
          width={1200}
          height={675}
          className="w-full h-auto rounded-lg shadow-[0_0_30px_10px_rgba(2,117,222,0.25)]"
          priority
        />
      </div>
    </section>
  )
}