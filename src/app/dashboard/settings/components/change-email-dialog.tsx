'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { verifyPasswordForEmailChange, requestEmailChange, verifyEmailChangeOtp, resendEmailChangeOtp } from '../actions'
import { Eye, EyeOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateUserCache } from '@/lib/cache/cache-utils'
import { cn } from '@/lib/utils'

interface ChangeEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail: string
}

type Step = 'password' | 'email' | 'verification'

export function ChangeEmailDialog({ 
  open, 
  onOpenChange, 
  currentEmail 
}: ChangeEmailDialogProps) {
  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false)
  const queryClient = useQueryClient()

  const resetDialog = () => {
    setStep('password')
    setPassword('')
    setNewEmail('')
    setOtp('')
    setShowPassword(false)
    setError(null)
    setSuccessMessage(null)
    setIsLoading(false)
    setResendCooldown(0)
    setEmailChangeSuccess(false)
  }

  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await verifyPasswordForEmailChange(password)
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setStep('email')
      setError(null)
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await requestEmailChange(newEmail, password)
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setStep('verification')
      setSuccessMessage('Verification code sent.')
      setError(null)
      setIsLoading(false)
      setResendCooldown(60) // Set initial cooldown
    }
  }

  // Auto-submit when 6 digits are entered
  const handleOtpComplete = useCallback(async (value: string) => {
    if (value.length === 6) {
      await handleOtpVerification(value)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEmail])

  const handleOtpVerification = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp
    if (codeToVerify.length !== 6) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await verifyEmailChangeOtp(newEmail, codeToVerify)
      if (result.error) {
        setError(result.error)
        setOtp('')
      } else {
        // Invalidate cache to update email display throughout the app
        await invalidateUserCache(queryClient)
        setEmailChangeSuccess(true)
        setSuccessMessage(result.message || 'Email successfully changed')
        // Close dialog after a short delay to show success
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch {
      setError('An error occurred. Please try again.')
      setOtp('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    
    setIsResending(true)
    setError(null)
    
    try {
      const result = await resendEmailChangeOtp(newEmail)
      if (result.error) {
        setError(result.error)
      } else {
        setResendCooldown(60)
        setOtp('')
        setSuccessMessage('Verification code resent')
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-serif">
            Change Email
          </DialogTitle>
          <DialogDescription className="text-sm text-warm-text-muted font-sans">
            Your current email is {currentEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Password Verification */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-sans">
                  Enter your password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your current password"
                    disabled={isLoading}
                    autoFocus
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-text-muted hover:text-warm-text-secondary"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-salmon-600 font-sans">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={!password || isLoading}
                className="w-full"
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </Button>
            </form>
          )}

          {/* Step 2: New Email Entry */}
          {step === 'email' && (
            <>
              <div className="bg-cream-200 rounded-md p-3 border border-stone-200">
                <p className="text-sm text-warm-text-secondary font-sans flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Password verified
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email" className="font-sans">
                    Enter your new email address to receive a verification code
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new.email@example.com"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-salmon-600 font-sans">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!newEmail || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send verification code'}
                </Button>
              </form>
            </>
          )}

          {/* Step 3: OTP Verification */}
          {step === 'verification' && (
            <>
              <div className="bg-cream-200 rounded-md p-3 border border-stone-200">
                <p className="text-sm text-warm-text-secondary font-sans flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Password verified
                </p>
              </div>

              <div className="bg-cream-200 rounded-md p-3 border border-stone-200">
                <p className="text-sm text-warm-text-secondary font-sans">
                  New email: {newEmail}
                </p>
              </div>

              {emailChangeSuccess ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-800 font-sans text-center">
                      {successMessage}
                    </p>
                  </div>
                  <p className="text-sm text-warm-text-muted font-sans text-center">
                    Your email has been successfully changed. This dialog will close automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-sans text-center block">
                      Enter the 6-digit code sent to {newEmail}
                    </Label>
                    
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={handleOtpChange}
                        disabled={isLoading}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className={cn(error && "border-salmon-600")} />
                          <InputOTPSlot index={1} className={cn(error && "border-salmon-600")} />
                          <InputOTPSlot index={2} className={cn(error && "border-salmon-600")} />
                          <InputOTPSlot index={3} className={cn(error && "border-salmon-600")} />
                          <InputOTPSlot index={4} className={cn(error && "border-salmon-600")} />
                          <InputOTPSlot index={5} className={cn(error && "border-salmon-600")} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-salmon-600 font-sans text-center">
                      {error}
                    </p>
                  )}

                  {successMessage && !error && (
                    <p className="text-sm text-green-600 font-sans text-center">
                      {successMessage}
                    </p>
                  )}

                  <Button
                    onClick={() => handleOtpVerification()}
                    disabled={otp.length !== 6 || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Verifying...' : 'Verify and change email'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                    className="w-full"
                  >
                    {isResending ? 'Sending...' : 
                     resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
                     'Resend code'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}