'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '../actions'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
  autoComplete?: string
  isLoading: boolean
}

const PasswordInput = ({ 
  id, 
  label, 
  value, 
  onChange, 
  show, 
  onToggle,
  placeholder,
  autoComplete,
  isLoading
}: PasswordInputProps) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="font-sans">
      {label}
    </Label>
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        autoComplete={autoComplete}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-text-muted hover:text-warm-text-secondary"
        tabIndex={-1}
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  </div>
)

export function PasswordSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setError(null)
    setSuccess(false)
    setIsLoading(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Only reset form when actually closing the dialog
      resetForm()
    }
    setIsDialogOpen(open)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await updatePassword(
      currentPassword,
      newPassword,
      confirmPassword
    )
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        handleOpenChange(false)
      }, 2000)
    }
  }

  return (
    <>
      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-serif font-medium text-warm-text-primary mb-2">
              Password
            </h3>
            <p className="text-sm text-warm-text-muted font-sans">
              Change the password to login to your account.
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
            className="h-auto py-2 px-4"
          >
            Change password
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="sm:max-w-md"
          showCloseButton={true}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-serif">
              Change Password
            </DialogTitle>
            <DialogDescription className="text-sm text-warm-text-muted font-sans">
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800 font-sans text-center">
                  Password updated successfully!
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput
                id="current-password"
                label="Enter your current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrentPassword}
                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                placeholder="Current password"
                autoComplete="current-password"
                isLoading={isLoading}
              />

              <PasswordInput
                id="new-password"
                label="Enter a new password"
                value={newPassword}
                onChange={setNewPassword}
                show={showNewPassword}
                onToggle={() => setShowNewPassword(!showNewPassword)}
                placeholder="New password (min. 6 characters)"
                autoComplete="new-password"
                isLoading={isLoading}
              />

              <PasswordInput
                id="confirm-password"
                label="Confirm your new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                isLoading={isLoading}
              />

              {error && (
                <div className="text-sm text-salmon-600 font-sans">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
                className="w-full"
              >
                {isLoading ? 'Changing password...' : 'Change password'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}