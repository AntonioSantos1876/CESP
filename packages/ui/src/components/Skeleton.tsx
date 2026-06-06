import React from 'react'

interface SkeletonProps {
  className?: string
  rounded?: boolean
}

export function Skeleton({ className = '', rounded = false }: SkeletonProps) {
  return (
    <div
      className={[
        'animate-pulse bg-bg-muted',
        rounded ? 'rounded-full' : 'rounded-lg',
        className,
      ].join(' ')}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-card rounded-2xl border border-bg-border p-5 space-y-3">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}
