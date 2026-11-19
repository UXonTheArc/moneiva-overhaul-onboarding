"use client"

import Link from "next/link"
import { ArrowRight, Brain, Check, Circle, GraduationCap, Mail, Phone, Sparkles } from "lucide-react"

import { PageHeader } from "@/components/moneiva/page-header"
import { STAGE_CLASS } from "@/components/moneiva/status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ME, REQUEST_TYPES, STAGES } from "@/lib/moneiva/data"
import { useHydrated, useSetup } from "@/lib/moneiva/setup-store"

const SETUP_STEPS = ["Your business", "Your team", "Email", "Phone and systems", "Documents"]

/** Home for a brand-new account: before setup it points to setup; after, it shows only what setup made. */
export function CleanHome() {
  const hydrated = useHydrated()
  const s = useSetup()
  const first = ME.name.split(" ")[0]
  if (!hydrated) return null

  if (!s)
    return (
      <>
        <PageHeader title={`Welcome, ${first}`} description="Your account is ready. Let's set up your Operator." />
        <Card className="gap-6 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <span className="grid size-12 flex-none place-items-center rounded-xl bg-indigo-50 text-blue-800 dark:bg-indigo-950 dark:text-blue-200">
              <Brain className="size-6" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">Set up your Operator</h2>
              <p className="text-muted-foreground">
                Connect your team&apos;s email and add a few documents. It reads them to learn how your team works. Nothing is sent. About 10 minutes.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/setup">
                <Sparkles /> Start setup
              </Link>
            </Button>
          </div>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {SETUP_STEPS.map((t, i) => (
              <li key={t} className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
                <span className="grid size-5 place-items-center rounded-full bg-muted text-xs">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </Card>
        <Steps counts={[0, 0, 0, 0]} />
      </>
    )

  const threads = s.inboxes.reduce((n, i) => n + i.threads, 0)
  const todo = [
    { done: true, label: `Connect email (${s.inboxes.length} ${s.inboxes.length === 1 ? "inbox" : "inboxes"})`, href: "/teach" },
    { done: s.docs.length > 0, label: s.docs.length ? `Upload documents (${s.docs.length})` : "Upload documents", href: "/teach?tab=documents" },
    { done: s.invites.length > 0, label: s.invites.length ? `Invite your team (${s.invites.length})` : "Invite your team", href: "/" },
    { done: false, label: "Check 38 threads it learned from", href: "/teach" },
    { done: false, label: "Name 3 new kinds of request", href: "/playbook" },
    { done: false, label: "Move your first request type to Shadow", href: "/playbook" },
  ]

  return (
    <>
      <PageHeader title={`Good morning, ${first}`} description={`${s.biz.name}'s Operator is learning. Here's what it has so far and what to do next.`} />

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950">
        <span className="grid size-9 place-items-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <GraduationCap className="size-[18px]" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
          <span className="font-semibold">38 threads to check</span>
          <span className="text-blue-900 dark:text-blue-200">Places where it would have done something different from your team. Each answer teaches it.</span>
        </div>
        <Button asChild>
          <Link href="/teach">
            Start checking <ArrowRight />
          </Link>
        </Button>
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2 px-0.5">
          <Link href="/operator" className="text-sm font-medium hover:underline">
            The Operator
          </Link>
          <span className="text-[13px] text-muted-foreground">Learning agents</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AgentTile href="/agents/op" icon={<Mail />} name="Email and texts" n={threads.toLocaleString()} sub={`threads read from ${s.inboxes.length} ${s.inboxes.length === 1 ? "inbox" : "inboxes"}`} />
          {s.phone ? <AgentTile href="/agents/phone" icon={<Phone />} name="Inbound phone line" n="0" sub="calls so far. It learns from each one" /> : null}
        </div>
      </section>

      <Steps counts={[REQUEST_TYPES.length, 0, 0, 0]} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Next steps</h2>
        <Card className="gap-0 divide-y py-0 shadow-none">
          {todo.map((t) => (
            <Link key={t.label} href={t.href} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
              {t.done ? (
                <span className="grid size-5 place-items-center rounded-full bg-green-600 text-white">
                  <Check className="size-3" />
                </span>
              ) : (
                <Circle className="size-5 text-muted-foreground/50" />
              )}
              <span className={cn("flex-1", t.done && "text-muted-foreground line-through")}>{t.label}</span>
              {!t.done ? <ArrowRight className="size-4 text-muted-foreground" /> : null}
            </Link>
          ))}
        </Card>
      </section>
    </>
  )
}

function AgentTile({ href, icon, name, n, sub }: { href: string; icon: React.ReactNode; name: string; n: string; sub: string }) {
  return (
    <Link href={href}>
      <Card className="gap-1 px-4 py-3.5 shadow-none transition-colors hover:bg-muted/40">
        <span className="flex items-center gap-1.5 text-[13px] font-medium [&>svg]:size-3.5 [&>svg]:text-muted-foreground">
          {icon}
          {name}
          <span className={cn("ml-auto rounded-md border px-1.5 text-xs font-medium", STAGE_CLASS.Learn)}>Learn</span>
        </span>
        <span className="text-[28px] font-semibold tracking-tight tabular-nums">{n}</span>
        <span className="text-[13px] text-muted-foreground">{sub}</span>
      </Card>
    </Link>
  )
}

function Steps({ counts }: { counts: number[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-medium">How much it does on its own</h2>
        <span className="text-muted-foreground">Every kind of request starts at Learn. Your team moves each one up when it&apos;s ready.</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAGES.map((st, i) => (
          <Link key={st} href={`/playbook?stage=${st}`}>
            <Card className="h-full gap-1 px-4 py-3.5 shadow-none transition-colors hover:bg-muted/40">
              <span className="flex items-center gap-2">
                <span className={cn("grid size-6 place-items-center rounded-full border text-xs font-semibold", STAGE_CLASS[st])}>{i + 1}</span>
                <span className="font-medium">{st}</span>
                <span className="ml-auto text-[22px] font-semibold tabular-nums">{counts[i]}</span>
              </span>
              <span className="text-[13px] text-muted-foreground">{counts[i] === 1 ? "kind of request" : "kinds of request"}</span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
