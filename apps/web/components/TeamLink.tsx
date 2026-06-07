import Link from 'next/link'
import { TeamLogo } from '@/components/TeamLogo'
import { getTeamHref } from '@/lib/school-teams'

type TeamLinkProps = {
  teamName: string
  className?: string
  nameClassName?: string
  logoSize?: number
  reverse?: boolean
  showLogo?: boolean
}

export function TeamLink({
  teamName,
  className = '',
  nameClassName = '',
  logoSize = 40,
  reverse = false,
  showLogo = true,
}: TeamLinkProps) {
  return (
    <Link
      href={getTeamHref(teamName)}
      className={`inline-flex min-w-0 items-center gap-3 transition-opacity hover:opacity-100 ${reverse ? 'flex-row-reverse text-right' : ''} ${className}`.trim()}
    >
      {showLogo && <TeamLogo teamName={teamName} size={logoSize} className="shrink-0" />}
      <span className={`min-w-0 truncate ${nameClassName}`.trim()}>{teamName}</span>
    </Link>
  )
}
