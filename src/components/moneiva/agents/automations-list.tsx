"use client"

import { Ellipsis, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/moneiva/page-header"
import { StatusDot, ToneBadge } from "@/components/moneiva/status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AUTOMATIONS, AUTOMATION_FILTERS, type AutomationFilter, type AutomationRow } from "@/lib/moneiva/automations-data"
import type { AgentStatus } from "@/lib/moneiva/data"

import { MenuItem } from "./menus"
import { useQuery } from "./use-query"

const COUNT_CLASS = "ml-1 rounded-md bg-muted px-1.5 text-xs leading-[18px] text-muted-foreground"

export function AutomationsList() {
  const q = useQuery()
  const router = useRouter()
  const raw = q.get("filter") as AutomationFilter | null
  const filter: AutomationFilter = raw && AUTOMATION_FILTERS.some((f) => f.value === raw) ? raw : "all"
  const [moved, setMoved] = useState<Record<string, AgentStatus>>({})
  const [search, setSearch] = useState("")

  const statusOf = (r: AutomationRow) => moved[r.id] ?? r.status
  const inFilter = (r: AutomationRow, f: AutomationFilter) =>
    f === "archived" ? statusOf(r) === "archived" : statusOf(r) !== "archived" && (f === "all" || statusOf(r) === "live")
  const rows = AUTOMATIONS.filter((r) => inFilter(r, filter)).filter((r) =>
    `${r.name} ${r.desc} ${r.agents}`.toLowerCase().includes(search.trim().toLowerCase())
  )

  const move = (r: AutomationRow, to: AgentStatus, msg: string) => {
    const was = statusOf(r)
    setMoved((m) => ({ ...m, [r.id]: to }))
    toast(msg, { action: { label: "Undo", onClick: () => setMoved((m) => ({ ...m, [r.id]: was })) } })
  }
  const open = (r: AutomationRow, extra = "") => {
    if (r.href) router.push(r.href + extra)
    else toast(`${r.name} is not part of this mockup. Open Damage report follow-up to see a workflow.`)
  }

  return (
    <>
      <PageHeader
        title="Workflows"
        description="Workflows move work along when something happens or on a schedule. They can hand work between agents, use one agent, or run with no agent at all."
        actions={
          <Button onClick={() => toast("Starting a new workflow is not part of this mockup. Open Damage report follow-up to see one.")}>
            <Plus /> New workflow
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative max-w-[360px] flex-[1_1_260px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows"
            aria-label="Search workflows"
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => q.set({ filter: v === "all" ? null : v })}>
          <TabsList aria-label="Filter workflows">
            {AUTOMATION_FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
                <span className={COUNT_CLASS}>{AUTOMATIONS.filter((r) => inFilter(r, f.value)).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filter === "archived" ? (
        <p className="-mt-2 text-[13px] text-muted-foreground">Archived workflows never run. Restore one to edit it or turn it back on.</p>
      ) : null}

      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((r) => {
          const s = statusOf(r)
          return (
            <Card key={r.id} className="gap-3 p-4">
              <div className="flex items-start gap-3">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
                  {r.href ? (
                    <Link href={r.href} className="text-[15px] font-semibold hover:underline">
                      {r.name}
                    </Link>
                  ) : (
                    <span className="text-[15px] font-semibold">{r.name}</span>
                  )}
                  <span className="text-[13px] text-muted-foreground">{r.desc}</span>
                </span>
                <RowMenu r={r} status={s} onOpen={open} onMove={move} />
              </div>
              <span className="flex flex-wrap items-center gap-1.5 text-[13px]">
                <StatusDot status={s} className={s === "archived" ? "text-muted-foreground" : undefined} />
                {r.draft && s !== "archived" ? <ToneBadge tone="blue">Draft changes</ToneBadge> : null}
              </span>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t pt-3 text-[13px]">
                <dt className="text-muted-foreground">Starts when</dt>
                <dd>{r.trigger}</dd>
                <dt className="text-muted-foreground">Agents</dt>
                <dd className={r.agents === "No agent" ? "text-muted-foreground" : undefined}>{r.agents}</dd>
                <dt className="text-muted-foreground">{s === "archived" ? "Archived" : "Last run"}</dt>
                <dd>{s === "archived" ? (r.archivedOn ?? "Archived today") : r.last}</dd>
              </dl>
            </Card>
          )
        })}
        {rows.length === 0 ? <p className="py-8 text-center text-muted-foreground">No workflows match.</p> : null}
      </div>

      <Card className="hidden gap-0 py-0 [contain:inline-size] md:flex">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Starts when</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agents</TableHead>
              <TableHead>{filter === "archived" ? "Archived" : "Last run"}</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const s = statusOf(r)
              return (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[280px] py-3 pl-4 whitespace-normal">
                    <div className="flex flex-col gap-0.5">
                      {r.href ? (
                        <Link href={r.href} className="font-medium hover:underline">
                          {r.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{r.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{r.desc}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] whitespace-normal text-muted-foreground">{r.trigger}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <StatusDot status={s} className={s === "archived" ? "text-muted-foreground" : undefined} />
                      {r.draft && s !== "archived" ? <ToneBadge tone="blue">Draft changes</ToneBadge> : null}
                    </span>
                  </TableCell>
                  <TableCell className={`text-[13px] whitespace-normal ${r.agents === "No agent" ? "text-muted-foreground" : ""}`}>{r.agents}</TableCell>
                  <TableCell className="text-muted-foreground">{s === "archived" ? (r.archivedOn ?? "Archived today") : r.last}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <RowMenu r={r} status={s} onOpen={open} onMove={move} />
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No workflows match.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}

function RowMenu({
  r,
  status: s,
  onOpen: open,
  onMove: move,
}: {
  r: AutomationRow
  status: AgentStatus
  onOpen: (r: AutomationRow, extra?: string) => void
  onMove: (r: AutomationRow, to: AgentStatus, msg: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${r.name}`} className="data-[state=open]:bg-accent">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {s === "archived" ? (
          <>
            <MenuItem label="Restore" sub="Comes back as Off" onSelect={() => move(r, "off", `${r.name} restored. It is off until you turn it on.`)} />
            <MenuItem label="Duplicate" />
            <DropdownMenuSeparator />
            <MenuItem label="Delete forever" sub="Its run history is deleted too" danger />
          </>
        ) : (
          <>
            <MenuItem label="Open" onSelect={() => open(r)} />
            <MenuItem label="Edit canvas" onSelect={() => open(r, "?tab=canvas&edit=1")} />
            <MenuItem label="Duplicate" />
            <MenuItem label="Rename" />
            {s === "live" ? (
              <MenuItem label="Turn off" sub="Stops new runs. Runs in progress finish." onSelect={() => move(r, "off", `${r.name} turned off.`)} />
            ) : (
              <MenuItem label="Turn on" sub="Uses the published version" onSelect={() => move(r, "live", `${r.name} is live.`)} />
            )}
            <DropdownMenuSeparator />
            <MenuItem label="Archive" sub="Turns it off and hides it here" danger onSelect={() => move(r, "archived", `${r.name} archived.`)} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
