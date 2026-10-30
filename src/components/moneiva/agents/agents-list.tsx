"use client"

import { CircleAlert, Ellipsis, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/moneiva/page-header"
import { StatusDot } from "@/components/moneiva/status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AGENTS, type Agent } from "@/lib/moneiva/agents-data"
import type { AgentStatus } from "@/lib/moneiva/data"

import { CreateAgentDialog } from "./create-agent-dialog"
import { KindIcon } from "./kind-icon"
import { MenuItem } from "./menus"
import { useQuery } from "./use-query"

export function AgentsList() {
  const q = useQuery()
  const [moved, setMoved] = useState<Record<string, AgentStatus>>({})
  const createOpen = q.get("create") === "1"

  const setStatus = (a: Agent, from: AgentStatus, to: AgentStatus, msg: string) => {
    setMoved((m) => ({ ...m, [a.id]: to }))
    toast(msg, {
      action: { label: "Undo", onClick: () => setMoved((m) => ({ ...m, [a.id]: from })) },
    })
  }

  return (
    <>
      <PageHeader
        title="Agents"
        description="Each agent works one channel for your team. Open one to change who it is, what it handles, and how it runs."
        actions={
          <Button onClick={() => q.set({ create: "1" })}>
            <Plus /> Create agent
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((a) => (
          <AgentCard key={a.id} agent={a} status={moved[a.id] ?? a.status} onStatus={setStatus} />
        ))}
      </div>
      <CreateAgentDialog open={createOpen} onOpenChange={(o) => q.set({ create: o ? "1" : null })} />
    </>
  )
}

function AgentCard({
  agent: a,
  status,
  onStatus,
}: {
  agent: Agent
  status: AgentStatus
  onStatus: (a: Agent, from: AgentStatus, to: AgentStatus, msg: string) => void
}) {
  const router = useRouter()
  return (
    <Card className="gap-3 p-[18px]">
      <div className="flex items-start gap-3">
        <KindIcon kind={a.kind} />
        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <Link href={a.href} className="text-[15px] font-semibold hover:underline">
            {a.name}
          </Link>
          <span className="text-[13px] text-muted-foreground">{a.channel}</span>
        </span>
        <StatusDot status={status} className="pt-0.5 text-[13px]" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${a.name}`} className="-mt-1 data-[state=open]:bg-accent">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[230px]">
            <MenuItem label="Open" onSelect={() => router.push(a.href)} />
            <MenuItem label="Test agent" sub="Try it without sending anything" onSelect={() => router.push(`${a.href}?test=1`)} />
            <MenuItem label="Duplicate" />
            {status === "off" ? (
              <MenuItem label="Turn on" onSelect={() => onStatus(a, status, "live", `${a.name} is live.`)} />
            ) : (
              <MenuItem
                label="Turn off"
                sub="New work goes to Inbox for a person"
                onSelect={() => onStatus(a, status, "off", `${a.name} turned off.`)}
              />
            )}
            <DropdownMenuSeparator />
            <MenuItem label="Delete" sub="Its history stays in Activity" danger />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{a.desc}</p>
      {status === "error" && a.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <CircleAlert className="mt-px size-4 flex-none" />
          <span>{a.error}</span>
        </div>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5 text-[13px]">
        <span>
          <span className="font-semibold">{a.today}</span>
          <span className="text-muted-foreground"> {a.todayLabel}</span>
        </span>
        {a.needs ? (
          <Link href={a.needsHref ?? "/inbox"} className="font-medium text-amber-800 hover:underline dark:text-amber-300">
            {a.needs}
          </Link>
        ) : (
          <span className="text-muted-foreground">{a.workflow}</span>
        )}
      </div>
    </Card>
  )
}
