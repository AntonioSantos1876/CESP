import { ShopPageClient } from '@/components/ShopPageClient'
import { getTeamNameFromSlug } from '@/lib/school-teams'
import { createClient } from '@/lib/supabase/server'

type ShopPageProps = {
  searchParams: Promise<{ team?: string }>
}

async function fetchPriceOverrides(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase as any).from('shop_prices').select('kind, price')
    const prices: Record<string, number> = {}
    for (const row of data ?? []) {
      prices[row.kind] = Number(row.price)
    }
    return prices
  } catch {
    return {}
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [{ team }, priceOverrides] = await Promise.all([
    searchParams,
    fetchPriceOverrides(),
  ])
  const filteredTeamName = team ? getTeamNameFromSlug(team) : null

  return (
    <ShopPageClient
      initialTeamSlug={filteredTeamName ? team ?? null : null}
      priceOverrides={priceOverrides}
    />
  )
}
