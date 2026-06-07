import Image from 'next/image'

type CespLogoProps = {
  size?: number
  className?: string
  priority?: boolean
}

export function CespLogo({ size = 32, className, priority = false }: CespLogoProps) {
  return (
    <Image
      src="/brand/cesp-logo.svg"
      alt="Clarendon Elite Sports Program logo"
      width={size}
      height={size}
      priority={priority}
      className={['shrink-0 rounded-[0.85rem]', className].filter(Boolean).join(' ')}
    />
  )
}
