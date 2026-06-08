import { HomePageClient } from '@/components/HomePageClient'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <HomePageClient isSignedIn={Boolean(user)} />
}
