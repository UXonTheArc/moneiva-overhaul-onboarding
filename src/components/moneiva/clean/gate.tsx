"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useHydrated, useSetup } from "@/lib/moneiva/setup-store"

/** An empty, friendly state for a brand-new account. */
export function Empty({
  icon,
  title,
  sub,
  action,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  action?: React.ReactNode
}) {
  return (
    <Card className="items-center gap-4 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground [&>svg]:size-6">{icon}</span>
      <div className="flex max-w-[480px] flex-col gap-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground">{sub}</p>
      </div>
      {action}
    </Card>
  )
}

export function SetupButton({ label = "Start setup" }: { label?: string }) {
  return (
    <Button asChild>
      <Link href="/setup">
        <Sparkles /> {label} <ArrowRight />
      </Link>
    </Button>
  )
}

/** Shows children only once setup has run. Before that, an empty state that points to setup. */
export function NeedsSetup({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  const hydrated = useHydrated()
  const setup = useSetup()
  if (!hydrated) return null
  if (!setup) return <Empty icon={icon} title={title} sub={sub} action={<SetupButton />} />
  return <>{children}</>
}

/** Agent pages exist only for agents setup created. */
export function AgentGate({ id, children }: { id: string; children: React.ReactNode }) {
  const hydrated = useHydrated()
  const setup = useSetup()
  if (!hydrated) return null
  const made = setup ? ["op", ...(setup.phone ? ["phone"] : [])] : []
  if (!made.includes(id))
    return (
      <Empty
        icon={<Sparkles />}
        title="This agent hasn't been made yet"
        sub={setup ? "Setup didn't create this one. Learning agents are made when you connect an inbox or a phone line." : "Agents are made during setup, when you connect an inbox or a phone line."}
        action={setup ? null : <SetupButton />}
      />
    )
  return <>{children}</>
}
