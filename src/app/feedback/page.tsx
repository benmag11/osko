import Image from 'next/image'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FeedbackClient } from './feedback-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feedback — Uncooked',
  description: 'Share your feedback about an Uncooked grind session.',
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ grind?: string }>
}) {
  const { grind: grindId } = await searchParams
  const supabase = await createServerSupabaseClient()

  // Fetch grind title
  let grindTitle: string | null = null
  if (grindId) {
    const { data } = await supabase
      .from('grinds')
      .select('title')
      .eq('id', grindId)
      .single()

    grindTitle = data?.title ?? null
  }

  if (!grindId || !grindTitle) {
    return (
      <div className="landing-background">
        <div className="relative z-10">
          <header className="px-6 md:px-12 lg:px-16 py-5">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <Link
                href="/"
                className="transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded"
              >
                <Image
                  src="/logo-full.svg"
                  alt="Uncooked"
                  width={134}
                  height={36}
                  priority
                  className="h-7 w-auto md:h-8"
                />
              </Link>
            </div>
          </header>

          <main className="px-6 md:px-12 lg:px-16 pt-12 md:pt-20 pb-20 md:pb-28">
            <div className="max-w-6xl mx-auto text-center">
              <h1 className="font-display text-3xl md:text-4xl font-medium text-[#1C1917] mb-3">
                Grind Not Found
              </h1>
              <p className="text-[#57534E] max-w-md mx-auto">
                This feedback link is invalid or the grind no longer exists.
              </p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Check auth for pre-fill
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userName: string | undefined
  let userEmail: string | undefined

  if (user) {
    userEmail = user.email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('user_id', user.id)
      .single()

    if (profile?.name) {
      userName = profile.name
    }
  }

  return (
    <div className="landing-background">
      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 md:px-12 lg:px-16 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded"
            >
              <Image
                src="/logo-full.svg"
                alt="Uncooked"
                width={134}
                height={36}
                priority
                className="h-7 w-auto md:h-8"
              />
            </Link>

            <div className="flex items-center gap-6">
              {user ? (
                <Link
                  href="/dashboard"
                  className="btn-salmon text-sm font-medium px-4 py-2 rounded-lg"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-link text-sm font-medium hidden sm:block"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="btn-salmon text-sm font-medium px-4 py-2 rounded-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="px-6 md:px-12 lg:px-16 pt-12 md:pt-20 pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 md:mb-14">
              <p className="small-caps text-[#57534E] text-sm mb-3">Feedback</p>
              <h1 className="font-display text-3xl md:text-4xl font-medium text-[#1C1917] mb-3">
                How Was the Grind?
              </h1>
              <p className="text-[#57534E] max-w-md mx-auto">
                Your feedback helps make future sessions better for everyone.
              </p>
            </div>

            <FeedbackClient
              grindId={grindId}
              grindTitle={grindTitle}
              userName={userName}
              userEmail={userEmail}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-12 lg:px-16 py-10 border-t border-[#1C1917]/8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image
                src="/logo-full.svg"
                alt="Uncooked"
                width={100}
                height={28}
                className="h-6 w-auto opacity-60"
              />
            </Link>
            <p className="text-sm text-[#57534E]">
              © {new Date().getFullYear()} Uncooked. Built for Irish students.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
