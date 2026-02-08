'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from '@/app/auth/actions'
import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Sending...' : 'Send reset code'}
    </Button>
  )
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await requestPasswordReset(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      const email = formData.get('email') as string
      router.push(`/auth/reset-verify?email=${encodeURIComponent(email.trim())}`)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <form action={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                {error && (
                  <div className="text-sm text-salmon-600 text-center font-sans">
                    {error}
                  </div>
                )}
                <SubmitButton />
              </div>
            </form>
            <div className="text-center text-sm">
              <a
                href="/auth/signin"
                className="underline underline-offset-4 hover:text-primary"
              >
                Back to sign in
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
