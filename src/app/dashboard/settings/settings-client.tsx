'use client'

import { NameSection } from './components/name-section'
import { EmailSection } from './components/email-section'
import { PasswordSection } from './components/password-section'
import { SubjectSection } from './components/subject-section'
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
    <div className="divide-y divide-stone-200">
      {/* Name Section */}
      <NameSection initialName={userName} />
      
      {/* Email Section */}
      <EmailSection currentEmail={userEmail} />
      
      {/* Password Section */}
      <PasswordSection />
      
      {/* Subject Section */}
      <SubjectSection 
        allSubjects={allSubjects}
        userSubjects={userSubjects}
      />
    </div>
  )
}