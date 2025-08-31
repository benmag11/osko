'use client'

import { useState } from 'react'
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
import { verifyPasswordForEmailChange, requestEmailChange } from '../actions'
import { Eye, EyeOff } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const resetDialog = () => {
    setStep('password')
    setPassword('')
    setNewEmail('')
    setShowPassword(false)
    setError(null)
    setSuccessMessage(null)
    setIsLoading(false)
  }

  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

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
      setSuccessMessage(result.message || 'Verification email sent')
      setError(null)
      setIsLoading(false)
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
                    Please enter new email, and we&apos;ll send you a verification code.
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
                  {isLoading ? 'Sending...' : 'Send verification email'}
                </Button>
              </form>
            </>
          )}

          {/* Step 3: Verification Sent */}
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

              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-800 font-sans">
                    {successMessage}
                  </p>
                </div>
                
                <p className="text-sm text-warm-text-muted font-sans">
                  Please check your email inbox at <strong>{newEmail}</strong> and click 
                  the verification link to complete the email change.
                </p>

                <p className="text-xs text-warm-text-subtle font-sans">
                  Note: The verification link will expire in 1 hour. You may need to check 
                  your spam folder.
                </p>

                <Button
                  onClick={handleClose}
                  className="w-full"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}