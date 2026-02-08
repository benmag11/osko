'use client'

import { NameSection } from './components/name-section'
import { EmailSection } from './components/email-section'
import { PasswordSection } from './components/password-section'
import { SubjectSection } from './components/subject-section'
import { FeatureRequestSection } from './components/feature-request-section'
import { BillingSection } from './components/billing-section'
import { SettingsSection } from '@/components/settings/settings-section'
import Link from 'next/link'
import type { Subject } from '@/lib/types/database'

interface SettingsClientProps {
  userEmail: string
  userName: string
  allSubjects: Subject[]
  userSubjects: Subject[]
}

export function SettingsClient({ 
  userEmail, 
  userName,
  allSubjects,
  userSubjects 
}: SettingsClientProps) {
  return (
    <div className="space-y-6">
      {/* Account Section */}
      <SettingsSection title="Account">
        <div className="divide-y divide-stone-200">
          <NameSection initialName={userName} />
          <EmailSection currentEmail={userEmail} />
          <PasswordSection />
        </div>
      </SettingsSection>

      {/* Billing Section */}
      <SettingsSection title="Billing">
        <BillingSection />
      </SettingsSection>

      {/* Subjects Section */}
      <SettingsSection title="Subjects">
        <SubjectSection
          allSubjects={allSubjects}
          userSubjects={userSubjects}
        />
      </SettingsSection>

      {/* Suggest a Feature Section */}
      <SettingsSection title="Suggest a Feature">
        <FeatureRequestSection />
      </SettingsSection>

      {/* Help & Support Section */}
      <SettingsSection title="Help & Support">
        <div className="p-4">
          <p className="text-sm text-warm-text-muted mb-3">
            Have a question, found a bug, or need help with billing?
          </p>
          <Link
            href="/contact"
            className="text-sm font-medium text-salmon-500 hover:text-salmon-600 transition-colors"
          >
            Contact us →
          </Link>
        </div>
      </SettingsSection>
    </div>
  )
}