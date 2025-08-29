'use client'

import { Button } from "@/components/ui/button"
import { signInWithGoogle } from '@/app/auth/oauth-actions'
import { useState } from 'react'

function OAuthButton({ 
  children, 
  pending,
  disabled 
}: { 
  children: React.ReactNode
  pending: boolean
  disabled: boolean
}) {
  return (
    <Button 
      type="submit" 
      variant="outline" 
      className="w-full" 
      disabled={disabled || pending}
    >
      {pending ? 'Redirecting...' : children}
    </Button>
  )
}

export function GoogleSignInButton() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleGoogleSignIn() {
    setIsPending(true)
    setError(null)
    
    try {
      const result = await signInWithGoogle()
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError('Failed to sign in with Google. Please try again.')
      setIsPending(false)
    }
  }
  
  return (
    <form action={handleGoogleSignIn} className="w-full">
      <OAuthButton pending={isPending} disabled={isPending}>
        <svg className="size-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="currentColor"
          />
        </svg>
        Sign in with Google
      </OAuthButton>
      {error && (
        <p className="text-sm text-salmon-600 mt-2 font-sans">{error}</p>
      )}
    </form>
  )
}

export function GoogleSignUpButton() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleGoogleSignUp() {
    setIsPending(true)
    setError(null)
    
    try {
      const result = await signInWithGoogle()
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      console.error('Google sign-up error:', err)
      setError('Failed to sign up with Google. Please try again.')
      setIsPending(false)
    }
  }
  
  return (
    <form action={handleGoogleSignUp} className="w-full">
      <OAuthButton pending={isPending} disabled={isPending}>
        <svg className="size-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="currentColor"
          />
        </svg>
        Sign up with Google
      </OAuthButton>
      {error && (
        <p className="text-sm text-salmon-600 mt-2 font-sans">{error}</p>
      )}
    </form>
  )
}