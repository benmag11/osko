'use client'

import { Button } from '@/components/ui/button'
import { ChangeEmailDialog } from './change-email-dialog'
import { useState } from 'react'

interface EmailSectionProps {
  currentEmail: string
}

export function EmailSection({ currentEmail }: EmailSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-base font-serif font-medium text-warm-text-primary mb-2">
            Email
          </h3>
          <p className="text-sm text-warm-text-muted font-sans">
            {currentEmail}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          className="h-auto py-2 px-4"
        >
          Change email
        </Button>
      </div>

      <ChangeEmailDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentEmail={currentEmail}
      />
    </div>
  )
}