import Image from 'next/image'
import Link from 'next/link'
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="bg-cream-100 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/LOGO -full.svg"
            alt="Osko"
            width={76}
            height={20}
            priority
            className="h-auto w-auto"
          />
        </Link>
        <LoginForm />
      </div>
    </div>
  )
}