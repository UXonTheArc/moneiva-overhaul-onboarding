"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Sparkles } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useHydrated, useSetup } from "@/lib/moneiva/setup-store"

/**
 * Top of every page. Before setup there's no sidebar at all (nothing behind it yet),
 * so the bar shows the logo and the account menu. Once setup runs, the full nav appears.
 */
export function TopBar({ title }: { title: string }) {
  const hydrated = useHydrated()
  const setup = useSetup()
  const router = useRouter()

  if (hydrated && !setup)
    return (
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6">
        <Link href="/" aria-label="Moneiva home" className="flex items-center">
          <Image src="/moneiva-logo.png" alt="Moneiva" width={112} height={28} className="h-auto w-28" priority />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-auto flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-xs font-semibold text-gray-600">TM</span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-[13px] font-medium">Taylor Morgan</span>
              <span className="text-[11px] text-muted-foreground">taylor@example.test</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Onboarding demo</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => router.push("/setup")}>
              <Sparkles /> Start setup
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Account settings</DropdownMenuItem>
            <DropdownMenuItem disabled>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    )

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      {hydrated ? (
        <>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        </>
      ) : null}
      <span className="text-sm font-medium">{title}</span>
    </header>
  )
}
