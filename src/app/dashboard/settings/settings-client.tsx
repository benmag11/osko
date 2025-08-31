'use client'

import { NameSection } from './components/name-section'
import { EmailSection } from './components/email-section'
import { PasswordSection } from './components/password-section'

interface SettingsClientProps {
  userEmail: string
  userName: string
}

export function SettingsClient({ userEmail, userName }: SettingsClientProps) {
  return (
    <div className="divide-y divide-stone-200">
      {/* Name Section */}
      <NameSection initialName={userName} />
      
      {/* Email Section */}
      <EmailSection currentEmail={userEmail} />
      
      {/* Password Section */}
      <PasswordSection />
    </div>
  )
}