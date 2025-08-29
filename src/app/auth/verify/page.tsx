import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { OTPVerificationForm } from "@/components/auth/otp-verification-form"

function VerificationContent() {
  return <OTPVerificationForm />
}

export default function VerifyPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/logo-full.svg"
            alt="Osko"
            width={76}
            height={20}
            priority
          />
        </Link>
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        }>
          <VerificationContent />
        </Suspense>
      </div>
    </div>
  )
}