'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyPasswordResetOtp, resendPasswordResetCode } from '@/app/auth/actions'
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function PasswordResetOtpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isSuccess, setIsSuccess] = useState(false)

  // If no email, redirect back to forgot password
  useEffect(() => {
    if (!email) {
      router.push('/auth/forgot-password')
    }
  }, [email, router])

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-submit when 6 digits are entered
  const handleOtpComplete = useCallback(async (value: string) => {
    if (value.length === 6) {
      await handleVerify(value)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const handleVerify = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp
    if (codeToVerify.length !== 6) return

    setIsVerifying(true)
    setError(null)

    try {
      const result = await verifyPasswordResetOtp(email, codeToVerify)
      if (result?.error) {
        setError(result.error)
        setOtp('')
        setIsVerifying(false)
      } else if (result?.redirectTo) {
        setIsSuccess(true)
        router.push(result.redirectTo)
      }
    } catch {
      setError('An error occurred. Please try again.')
      setOtp('')
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    setError(null)

    try {
      const result = await resendPasswordResetCode(email)
      if (result?.error) {
        setError(result.error)
      } else {
        setResendCooldown(60)
        setOtp('')
      }
    } catch {
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleOtpChange = (value: string) => {
    setOtp(value)
    setError(null)
    if (value.length === 6) {
      handleOtpComplete(value)
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Code verified!</CardTitle>
            <CardDescription>
              Redirecting to set your new password...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            A 6-digit code has been sent to <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOtpChange}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className={cn(error && "border-destructive")} />
                  <InputOTPSlot index={1} className={cn(error && "border-destructive")} />
                  <InputOTPSlot index={2} className={cn(error && "border-destructive")} />
                  <InputOTPSlot index={3} className={cn(error && "border-destructive")} />
                  <InputOTPSlot index={4} className={cn(error && "border-destructive")} />
                  <InputOTPSlot index={5} className={cn(error && "border-destructive")} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <div className="text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <Button
              onClick={() => handleVerify()}
              disabled={otp.length !== 6 || isVerifying}
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-warm-text-muted font-sans relative z-10 px-2">
                Didn&apos;t receive the code?
              </span>
            </div>

            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="w-full"
            >
              {isResending ? 'Sending...' :
               resendCooldown > 0 ? `Resend in ${resendCooldown}s` :
               'Resend Code'}
            </Button>

            <div className="text-center text-sm">
              Wrong email?{" "}
              <a href="/auth/forgot-password" className="underline underline-offset-4 hover:text-salmon-500">
                Go back
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
