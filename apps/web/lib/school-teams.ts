export type TeamBranding = {
  slug: string
  shortName: string
  primary: string
  secondary: string
  accent: string
  logoPath: string | null
}

export const SCHOOL_TEAM_BRANDING: Record<string, TeamBranding> = {
  'Denbigh High School': {
    slug: 'denbigh-high-school',
    shortName: 'DHS',
    primary: '#31c4cb',
    secondary: '#f4f7f8',
    accent: '#9be8ea',
    logoPath: '/team-logos/denbigh-high-school.jpeg',
  },
  'Excelsior High School': {
    slug: 'excelsior-high-school',
    shortName: 'EHS',
    primary: '#0e6b40',
    secondary: '#f3bf1d',
    accent: '#d3a419',
    logoPath: '/team-logos/excelsior-high-school.jpeg',
  },
  'Glenmuir High School': {
    slug: 'glenmuir-high-school',
    shortName: 'GHS',
    primary: '#cf2027',
    secondary: '#f3f4f6',
    accent: '#9f171d',
    logoPath: '/team-logos/glenmuir-high-school.jpeg',
  },
  'Kingston College': {
    slug: 'kingston-college',
    shortName: 'KC',
    primary: '#6b35b8',
    secondary: '#f4f3ff',
    accent: '#a78bfa',
    logoPath: '/team-logos/kingston-college.jpeg',
  },
  'Manchester High School': {
    slug: 'manchester-high-school',
    shortName: 'MHS',
    primary: '#d4a017',
    secondary: '#fff8e1',
    accent: '#f0c830',
    logoPath: '/team-logos/manchester-high-school.jpeg',
  },
  'Mona High School': {
    slug: 'mona-high-school',
    shortName: 'MON',
    primary: '#111111',
    secondary: '#cc2222',
    accent: '#991a1a',
    logoPath: '/team-logos/mona-high-school.jpeg',
  },
  'Munro College': {
    slug: 'munro-college',
    shortName: 'MUN',
    primary: '#1b46c7',
    secondary: '#efc22b',
    accent: '#5a6ab2',
    logoPath: '/team-logos/munro-college.jpeg',
  },
  'Vere Technical High School': {
    slug: 'vere-technical-high-school',
    shortName: 'VTHS',
    primary: '#228454',
    secondary: '#f6f7f7',
    accent: '#7cc6a3',
    logoPath: '/team-logos/vere-technical-high-school.jpeg',
  },
}

export const SCHOOL_TEAM_ORDER = Object.keys(SCHOOL_TEAM_BRANDING).sort((left, right) =>
  left.localeCompare(right)
)

export const DEMO_SCHOOL_FIXTURES = [
  { id: 1, home: 'Vere Technical High School', away: 'Mona High School', date: '2026-07-31', time: '10:00', venue: 'Glenmuir High School', status: 'upcoming', homeScore: null, awayScore: null, round: 'Quarter-final 1' },
  { id: 2, home: 'Denbigh High School', away: 'Excelsior High School', date: '2026-07-31', time: '12:00', venue: 'Glenmuir High School', status: 'upcoming', homeScore: null, awayScore: null, round: 'Quarter-final 2' },
  { id: 3, home: 'Kingston College', away: 'Manchester High School', date: '2026-07-31', time: '14:00', venue: 'Glenmuir High School', status: 'upcoming', homeScore: null, awayScore: null, round: 'Quarter-final 3' },
  { id: 4, home: 'Glenmuir High School', away: 'Munro College', date: '2026-07-31', time: '16:00', venue: 'Glenmuir High School', status: 'upcoming', homeScore: null, awayScore: null, round: 'Quarter-final 4' },
]

export function slugifyTeamName(teamName: string) {
  return teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function getTeamShortName(teamName: string) {
  return teamName
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 4)
    .toUpperCase()
}

export function getTeamBranding(teamName: string): TeamBranding {
  return SCHOOL_TEAM_BRANDING[teamName] ?? {
    slug: slugifyTeamName(teamName),
    shortName: getTeamShortName(teamName),
    primary: '#E85D04',
    secondary: '#FFFFFF',
    accent: '#FF8C42',
    logoPath: null,
  }
}

export function getTeamSlug(teamName: string) {
  return getTeamBranding(teamName).slug
}

export function getTeamHref(teamName: string) {
  return `/teams/${getTeamSlug(teamName)}`
}

export function getTeamLogoPath(teamName: string) {
  return getTeamBranding(teamName).logoPath
}

export function getTeamNameFromSlug(slug: string) {
  return Object.entries(SCHOOL_TEAM_BRANDING).find(([, branding]) => branding.slug === slug)?.[0] ?? null
}

export function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '')
  const normalized = sanitized.length === 3
    ? sanitized.split('').map(char => char + char).join('')
    : sanitized
  const value = Number.parseInt(normalized, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
