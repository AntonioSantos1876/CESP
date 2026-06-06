import { createClient } from '@/lib/supabase/server'
import { Nav } from './Nav'

export async function NavServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let navUser: { email?: string; full_name?: string; role?: string } | null = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    navUser = {
      email: user.email,
      full_name: (data as { full_name: string | null; role: string | null } | null)?.full_name ?? undefined,
      role: (data as { full_name: string | null; role: string | null } | null)?.role ?? undefined,
    }
  }

  return <Nav user={navUser} />
}
