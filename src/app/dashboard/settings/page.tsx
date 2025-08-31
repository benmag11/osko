import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex-1 bg-cream-50">
        <div className="px-8 py-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-warm-text-muted">
              Please sign in to view your settings
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('user_id', user.id)
    .single()
  
  return (
    <div className="flex-1 bg-cream-50">
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-serif font-semibold text-warm-text-primary mb-8">
            Account
          </h1>
          
          <div className="bg-cream-100 rounded-lg border border-stone-300">
            <SettingsClient 
              userEmail={user.email || ''}
              userName={profile?.name || ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}