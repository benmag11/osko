import Image from 'next/image'
import Link from 'next/link'
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <div className="bg-cream-100 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/logo-full.svg"
            alt="Osko"
            width={96}
            height={25}
            priority
          />
        </Link>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
