import type { ReactNode } from "react"

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-16 text-center">
      <h3 className="font-serif text-lg text-foreground">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
