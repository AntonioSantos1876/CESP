import Image from 'next/image'
import { getTeamBranding, getTeamLogoPath, hexToRgba } from '@/lib/school-teams'

type TeamLogoProps = {
  teamName: string
  size?: number
  className?: string
}

export function TeamLogo({ teamName, size = 44, className = '' }: TeamLogoProps) {
  const branding = getTeamBranding(teamName)
  const logoPath = getTeamLogoPath(teamName)

  return (
    <div
      className={`relative overflow-hidden rounded-[1.1rem] border ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderColor: hexToRgba(branding.primary, 0.3),
        background: `linear-gradient(145deg, ${hexToRgba(branding.secondary, 0.96)} 0%, ${hexToRgba(branding.primary, 0.15)} 100%)`,
      }}
    >
      {logoPath ? (
        <Image
          src={logoPath}
          alt={`${teamName} logo`}
          fill
          sizes={`${size}px`}
          className="object-cover object-center"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] font-black uppercase tracking-wide" style={{ color: branding.primary }}>
          {branding.shortName}
        </div>
      )}
    </div>
  )
}
