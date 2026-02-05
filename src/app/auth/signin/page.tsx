import Image from 'next/image'
import Link from 'next/link'
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  )
}