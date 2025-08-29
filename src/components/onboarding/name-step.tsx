'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface NameStepProps {
  onNext: (name: string) => void
  initialName?: string
}

export function NameStep({ onNext, initialName = '' }: NameStepProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (name.trim().length < 2) {
      setError('Please enter at least 2 characters')
      return
    }
    
    onNext(name.trim())
  }

  useEffect(() => {
    setError('')
  }, [name])

  return (
    <div className="flex justify-center items-center flex-1">
      <Card className="w-full max-w-md border-[#e5e5e5] shadow-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold">Welcome! Let&apos;s get started</CardTitle>
          <CardDescription className="text-base text-[#757575]">
            First, what should we call you?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Your name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 text-base"
                autoFocus
                aria-describedby={error ? 'name-error' : undefined}
              />
              {error && (
                <p id="name-error" className="text-sm text-salmon-600 mt-1 font-sans">
                  {error}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={!name.trim()}
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}