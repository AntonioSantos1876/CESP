export type TeamBranding = {
  shortName: string
  primary: string
  secondary: string
  accent: string
}

export const SCHOOL_TEAM_BRANDING: Record<string, TeamBranding> = {
  'Denbigh High School': {
    shortName: 'DHS',
    primary: '#31c4cb',
    secondary: '#f4f7f8',
    accent: '#9be8ea',
  },
  'Excelsior High School': {
    shortName: 'EHS',
    primary: '#0e6b40',
    secondary: '#f3bf1d',
    accent: '#d3a419',
  },
  'Glenmuir High School': {
    shortName: 'GHS',
    primary: '#cf2027',
    secondary: '#f3f4f6',
    accent: '#9f171d',
  },
  'Kingston College': {
    shortName: 'KC',
    primary: '#6b35b8',
    secondary: '#f4f3ff',
    accent: '#a78bfa',
  },
  'Manchester High School': {
    shortName: 'MHS',
    primary: '#2f1a17',
    secondary: '#efc22b',
    accent: '#7f5b22',
  },
  'Mona High School': {
    shortName: 'MON',
    primary: '#b92a22',
    secondary: '#e8b51f',
    accent: '#f08d32',
  },
  'Munro College': {
    shortName: 'MUN',
    primary: '#1b46c7',
    secondary: '#efc22b',
    accent: '#5a6ab2',
  },
  'Vere Technical High School': {
    shortName: 'VTHS',
    primary: '#228454',
    secondary: '#f6f7f7',
    accent: '#7cc6a3',
  },
}

export const SCHOOL_TEAM_ORDER = Object.keys(SCHOOL_TEAM_BRANDING).sort((left, right) =>
  left.localeCompare(right)
)

export const DEMO_SCHOOL_FIXTURES = [
  { id: 1, home: 'Denbigh High School', away: 'Excelsior High School', date: '2026-07-31', time: '10:00', venue: 'Glenmuir High School', status: 'upcoming', homeScore: null, awayScore: null, round: 'Quarter-final 1' },
  { id: 2, home: 'Glenmuir High School', away: 'Kingston College', date: '2026-07-31', time: '12:00', venue: 'Glenmuir High School', status: 'upcoming', homeScore: null, awayScore: null, round: 'Quarter-final 2' },
  { id: 3, home: 'Manchester High School', away: 'Mona High School', date: '2026-07-31', time: '14:00', venue: 'Glenmuir High School', status: 'upcoming', homeScore: null, awayScore: null, round: 'Quarter-final 3' },
  { id: 4, home: 'Munro College', away: 'Vere Technical High School', date: '2026-07-31', time: '16:00', venue: 'Glenmuir High School', status: 'upcoming', homeScore: null, awayScore: null, round: 'Quarter-final 4' },
  { id: 9, home: 'Excelsior High School', away: 'Mona High School', date: '2026-06-06', time: '15:00', venue: 'Glenmuir High School', status: 'live', homeScore: 1, awayScore: 0, round: 'Exhibition Match' },
]

export function getTeamBranding(teamName: string): TeamBranding {
  return SCHOOL_TEAM_BRANDING[teamName] ?? {
    shortName: teamName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 4)
      .toUpperCase(),
    primary: '#E85D04',
    secondary: '#FFFFFF',
    accent: '#FF8C42',
  }
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
