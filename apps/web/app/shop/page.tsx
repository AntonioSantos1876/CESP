import { ShopPageClient } from '@/components/ShopPageClient'
import { getTeamNameFromSlug } from '@/lib/school-teams'

type ShopPageProps = {
  searchParams: Promise<{ team?: string }>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { team } = await searchParams
  const filteredTeamName = team ? getTeamNameFromSlug(team) : null

  return <ShopPageClient initialTeamSlug={filteredTeamName ? team ?? null : null} />
}
