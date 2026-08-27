import type { ReactNode } from "react"

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-2">
      <div className="min-w-0">
        <h1 className="font-serif text-[28px] leading-tight tracking-tight text-foreground md:text-[32px]">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
