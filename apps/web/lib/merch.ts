import { SCHOOL_TEAM_BRANDING, SCHOOL_TEAM_ORDER, getTeamSlug, type TeamBranding } from '@/lib/school-teams'

export type MerchCategory = 'jerseys' | 'headwear' | 'hydration' | 'equipment'
export type MerchKind = 'jersey' | 'cap' | 'bottle' | 'armband'

export type MerchProduct = {
  id: string
  teamName: string
  teamSlug: string
  kind: MerchKind
  category: MerchCategory
  name: string
  description: string
  price: number
  sizes: string[]
  customizable: boolean
  badge?: string
  imagePath?: string
  branding: TeamBranding
}

const TEAM_JERSEY_ASSETS: Record<string, string> = {
  'Denbigh High School': '/merch/teams/denbigh-high-school.jpeg',
  'Excelsior High School': '/merch/teams/excelsior-high-school.jpeg',
  'Glenmuir High School': '/merch/teams/glenmuir-high-school.jpeg',
  'Manchester High School': '/merch/teams/manchester-high-school.jpeg',
  'Mona High School': '/merch/teams/mona-high-school.jpeg',
  'Munro College': '/merch/teams/munro-college.jpeg',
  'Vere Technical High School': '/merch/teams/vere-technical-high-school.jpeg',
}

function buildTeamMerch(teamName: string): MerchProduct[] {
  const branding = SCHOOL_TEAM_BRANDING[teamName]
  const teamSlug = getTeamSlug(teamName)
  const imagePath = TEAM_JERSEY_ASSETS[teamName]

  return [
    {
      id: `${teamSlug}-home-jersey`,
      teamName,
      teamSlug,
      kind: 'jersey',
      category: 'jerseys',
      name: `${teamName} Jersey Shirt`,
      description: 'Official jersey shirt in school colours with optional name and number personalisation.',
      price: 45,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      customizable: true,
      badge: 'Best seller',
      imagePath,
      branding,
    },
    {
      id: `${teamSlug}-supporter-cap`,
      teamName,
      teamSlug,
      kind: 'cap',
      category: 'headwear',
      name: `${teamName} Supporter Cap`,
      description: 'Structured cap in school colours with embroidered crest for matchday wear.',
      price: 18,
      sizes: ['One size'],
      customizable: false,
      imagePath,
      branding,
    },
    {
      id: `${teamSlug}-water-bottle`,
      teamName,
      teamSlug,
      kind: 'bottle',
      category: 'hydration',
      name: `${teamName} Water Bottle`,
      description: '750ml bottle finished in school colours with logo lockup for training and school runs.',
      price: 14,
      sizes: ['750ml'],
      customizable: false,
      imagePath,
      branding,
    },
    {
      id: `${teamSlug}-captains-armband`,
      teamName,
      teamSlug,
      kind: 'armband',
      category: 'equipment',
      name: `${teamName} Captain Armband`,
      description: 'Elastic captain armband with club-inspired trim for coaches, captains, and collectors.',
      price: 9,
      sizes: ['Junior', 'Senior'],
      customizable: false,
      imagePath,
      branding,
    },
  ]
}

export const MERCH_PRODUCTS = SCHOOL_TEAM_ORDER.flatMap(buildTeamMerch)

export const MERCH_CATEGORY_LABELS: Record<'all' | MerchCategory, string> = {
  all: 'All merch',
  jerseys: 'Jersey Shirts',
  headwear: 'Caps',
  hydration: 'Bottles',
  equipment: 'Extras',
}

export const FEATURED_JERSEYS = MERCH_PRODUCTS.filter(product => product.kind === 'jersey')

export function getMerchProductById(productId: string) {
  return MERCH_PRODUCTS.find(product => product.id === productId) ?? null
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}
