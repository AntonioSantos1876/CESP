import Image from 'next/image'
import Link from 'next/link'
import { MAIN_SPONSORS } from '@/lib/sponsors'

type SponsorShowcaseProps = {
  description: string
  heading?: string
  eyebrow?: string
  compact?: boolean
  showLink?: boolean
}

export function SponsorShowcase({
  description,
  heading = 'Main Sponsors',
  eyebrow = 'Backed By',
  compact = false,
  showLink = false,
}: SponsorShowcaseProps) {
  return (
    <section className={`rounded-[2.25rem] border border-white/10 bg-[#101010] ${compact ? 'p-6 md:p-8' : 'p-8 md:p-10'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand-secondary">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black text-text-primary md:text-4xl">{heading}</h2>
          <p className="mt-3 text-text-secondary">{description}</p>
        </div>

        {showLink && (
          <Link href="/sponsors" className="btn-secondary w-full text-center lg:w-auto">
            View all sponsor details
          </Link>
        )}
      </div>

      <div className={`mt-8 grid gap-5 ${compact ? 'sm:grid-cols-2 xl:grid-cols-5' : 'sm:grid-cols-2 xl:grid-cols-5'}`}>
        {MAIN_SPONSORS.map(sponsor => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-[0_24px_48px_rgba(0,0,0,0.24)]"
          >
            <div className="flex flex-1 min-h-[180px] items-center justify-center p-6">
              <div className="relative h-32 w-full">
                <Image
                  src={sponsor.imagePath}
                  alt={sponsor.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 20vw"
                />
              </div>
            </div>
            <div className="border-t border-black/8 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{sponsor.name}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
