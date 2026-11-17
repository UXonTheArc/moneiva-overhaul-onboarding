import Link from "next/link"
import { ArrowRight, CalendarDays, ChevronDown, Mail, Phone, PhoneOutgoing } from "lucide-react"

import { cn } from "@/lib/utils"
import { LEARNING_AGENTS, TASK_AGENTS, type Agent, type AgentKind } from "@/lib/moneiva/agents-data"
import { STATUS } from "@/components/moneiva/status"
import { Card } from "@/components/ui/card"

const KIND_ICON: Record<AgentKind, typeof Mail> = {
  email: Mail,
  inbound: Phone,
  outbound: PhoneOutgoing,
  files: CalendarDays,
}

/** What each tile says on Home, where it differs from the agent record. */
const HOME_TILE: Partial<Record<Agent["id"], { sub: string; needs: string; needsHref?: string }>> = {
  osd: { sub: "stopped at 7:10 AM", needs: "Fix its phone number", needsHref: "/agents/osd" },
  cat: { sub: "not running", needs: "" },
}

// Each tile has two click targets: the name and status open the agent (turn it on, off or fix it),
// and the footer opens the work that is waiting.
export function AgentStrip() {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-5 xl:grid-cols-5">
      <Group
        className="xl:col-span-2"
        title="The Operator"
        sub="Learning agents"
        href="/operator"
        cols="sm:grid-cols-2"
        agents={LEARNING_AGENTS}
      />
      <Group className="xl:col-span-3" title="Task agents" sub="Follow a script" href="/agents" cols="sm:grid-cols-2 lg:grid-cols-3" agents={TASK_AGENTS} />
    </div>
  )
}

function Group({ title, sub, href, agents, cols, className }: { title: string; sub: string; href: string; agents: Agent[]; cols: string; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-baseline gap-2 px-0.5">
        <Link href={href} className="text-sm font-medium hover:underline">
          {title}
        </Link>
        <span className="text-[13px] text-muted-foreground">{sub}</span>
      </div>
      <div className={cn("grid grid-cols-1 gap-3", cols)}>
        <Tiles agents={agents} />
      </div>
    </section>
  )
}

function Tiles({ agents }: { agents: Agent[] }) {
  return (
    <>
      {agents.map((a) => {
        const Icon = KIND_ICON[a.kind]
        const tile = HOME_TILE[a.id]
        const sub = tile?.sub ?? a.todayLabel
        const needs = tile ? tile.needs : a.needs
        const needsHref = tile?.needsHref ?? a.needsHref ?? "/inbox"
        const isError = a.status === "error"
        return (
          <Card key={a.id} className="min-w-0 gap-0 overflow-hidden py-0 shadow-none">
            <div className="flex flex-col gap-1 px-4 pt-3.5 pb-3">
              <Link
                href={a.href}
                className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium hover:underline"
              >
                <Icon className="size-3.5 flex-none text-muted-foreground" aria-hidden />
                <span className="truncate">{a.name}</span>
              </Link>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[28px] font-semibold tracking-tight">{a.today}</span>
                <Link
                  href={a.href}
                  title="Open the agent to turn it on, off, or fix it"
                  className={cn(
                    "flex flex-none items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-muted",
                    a.status === "off" && "text-muted-foreground"
                  )}
                >
                  <i className={cn("size-2 rounded-full", STATUS[a.status].dot)} />
                  {STATUS[a.status].label}
                  <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
                </Link>
              </div>
              <span className="text-[13px] text-muted-foreground">{sub}</span>
            </div>
            {needs ? (
              <Link
                href={needsHref}
                className={cn(
                  "flex items-center justify-between gap-2 border-t bg-muted/40 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted",
                  isError ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"
                )}
              >
                {needs}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            ) : (
              <span className="border-t bg-muted/40 px-4 py-2.5 text-[13px] text-muted-foreground">Nothing waiting</span>
            )}
          </Card>
        )
      })}
    </>
  )
}
