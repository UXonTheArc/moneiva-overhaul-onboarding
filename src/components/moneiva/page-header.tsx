import Link from "next/link"
import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

/** The thin bar at the top of the content area: sidebar toggle plus the page name. Sticky, so it stays put when a phone restores scroll on refresh. */
export function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <span className="text-sm font-medium">{title}</span>
    </header>
  )
}

export type Crumb = { label: string; href?: string }

/** Page title block: optional breadcrumb, h1, description, and actions on the right. */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  leading,
}: {
  title: ReactNode
  description?: ReactNode
  crumbs?: Crumb[]
  actions?: ReactNode
  leading?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      {crumbs?.length ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[13px] text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex gap-2">
              {c.href ? (
                <Link href={c.href} className="hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
              {i < crumbs.length - 1 ? <span>/</span> : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {leading}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-50">{title}</h1>
            {description ? <p className="text-gray-600 dark:text-gray-400">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

/** Standard page body: top bar plus padded content column. */
export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <TopBar title={title} />
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">{children}</div>
    </>
  )
}
