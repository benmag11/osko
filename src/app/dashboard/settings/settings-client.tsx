'use client'

import { NameSection } from './components/name-section'
import { EmailSection } from './components/email-section'
import { PasswordSection } from './components/password-section'
import { SubjectSection } from './components/subject-section'
import { BillingSection } from './components/billing-section'
import { SettingsSection } from '@/components/settings/settings-section'
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
    </div>
  )
}