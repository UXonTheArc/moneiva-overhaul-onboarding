"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, FileText, Loader, Mail, Plus, Upload } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DOCS } from "@/lib/moneiva/data"
import { FACT_COUNT } from "@/lib/moneiva/playbook-data"
import { FOLDERS, INBOXES, RANGES, SCOPE_LABEL, SCOPE_SUB, scopeLine, type InboxSource, type ReadScope } from "@/lib/moneiva/inbox-sources-data"

/**
 * Teach opens on what the Operator learns from: every connected inbox and every document.
 * Inboxes are grouped under the agent that answers them, so it's clear one agent can cover several inboxes.
 */
export function LearnsFrom({ onDocs }: { onDocs: () => void }) {
  const [inboxes, setInboxes] = useState<InboxSource[]>(INBOXES)
  const [edit, setEdit] = useState<InboxSource | "new" | null>(null)
  const agents = [...new Set(inboxes.map((i) => i.agent))]

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b px-[18px] py-3.5">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium">Inboxes</span>
            <span className="text-[13px] text-muted-foreground">
              {inboxes.length} connected · {agents.length === 1 ? `all answered by ${agents[0]}` : `${agents.length} agents`}
            </span>
          </div>
          <Button size="sm" onClick={() => setEdit("new")}>
            <Plus /> Add inbox
          </Button>
        </div>
        {agents.map((agent) => {
          const rows = inboxes.filter((i) => i.agent === agent)
          return (
            <div key={agent} className="flex flex-col">
              <Link
                href={rows[0].agentHref}
                className="flex items-center gap-2 bg-muted/40 px-[18px] py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Answered by {agent} <span className="font-normal">· learning agent</span>
                <ArrowRight className="size-3" />
              </Link>
              <ul className="divide-y">
                {rows.map((i) => (
                  <li key={i.address}>
                    <button type="button" onClick={() => setEdit(i)} className="flex w-full items-center gap-3 px-[18px] py-3 text-left hover:bg-muted/40">
                      <span className="grid size-9 flex-none place-items-center rounded-lg bg-indigo-50 text-blue-800 dark:bg-indigo-950 dark:text-blue-200">
                        <Mail className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-x-2">
                          <span className="font-medium">{i.address}</span>
                          <span className="text-xs text-muted-foreground">{i.provider}</span>
                        </span>
                        <span className="truncate text-[13px] text-muted-foreground">{scopeLine(i)}</span>
                        {i.state === "reading" && i.total ? (
                          <span className="mt-1 flex items-center gap-2">
                            <span className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                              <span className="block h-full rounded-full bg-blue-600" style={{ width: `${(i.read / i.total) * 100}%` }} />
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {i.read.toLocaleString()} of {i.total.toLocaleString()}
                            </span>
                          </span>
                        ) : null}
                      </span>
                      <State i={i} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </Card>

      <Card className="gap-3 p-[18px]">
        <div className="flex flex-col">
          <span className="font-medium">Documents</span>
          <span className="text-[13px] text-muted-foreground">
            {DOCS.length} documents · {FACT_COUNT} facts learned
          </span>
        </div>
        <ul className="flex flex-col gap-2 text-[13px]">
          {DOCS.slice(0, 3).map((d) => (
            <li key={d.name} className="flex items-center gap-2">
              <FileText className="size-3.5 flex-none text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{d.name}</span>
              <span className="text-muted-foreground">{d.facts}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap gap-2">
          <Button size="sm" onClick={onDocs}>
            <Upload /> Upload document
          </Button>
          <Button size="sm" variant="ghost" onClick={onDocs}>
            See all
          </Button>
        </div>
      </Card>

      <InboxDialog
        target={edit}
        onOpenChange={(o) => !o && setEdit(null)}
        onSave={(i, isNew) => {
          setInboxes((all) => (isNew ? [...all, i] : all.map((x) => (x.address === i.address ? i : x))))
          setEdit(null)
          toast.success(isNew ? `${i.address} connected` : `${i.address} updated`, {
            description: i.scope === "new" ? "It starts learning from the next email." : "New threads show up under Check first as they're read.",
          })
        }}
      />
    </section>
  )
}

function State({ i }: { i: InboxSource }) {
  if (i.state === "reading")
    return (
      <span className="inline-flex flex-none items-center gap-1.5 text-[13px] text-blue-700 dark:text-blue-300">
        <Loader className="size-3.5 animate-spin" /> Reading
      </span>
    )
  return (
    <span className="flex flex-none flex-col items-end text-[13px]">
      <span className="inline-flex items-center gap-1.5">
        <i className={cn("size-2 rounded-full", i.state === "live" ? "bg-green-600" : "bg-blue-600")} />
        {i.state === "live" ? "Learning" : "Watching new email"}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">{i.read.toLocaleString()} threads read</span>
    </span>
  )
}

/** Connect a new inbox, or change what an existing one reads. Shared with Setup. */
export function ScopePicker({
  scope,
  setScope,
  range,
  setRange,
  folders,
  setFolders,
  idPrefix = "scope",
}: {
  scope: ReadScope
  setScope: (s: ReadScope) => void
  range: string
  setRange: (r: string) => void
  folders: string[]
  setFolders: (f: string[]) => void
  idPrefix?: string
}) {
  return (
    <div role="radiogroup" aria-label="What should it read?" className="flex flex-col gap-2">
      {(["all", "folders", "new"] as ReadScope[]).map((s) => {
        const on = scope === s
        return (
          <div key={s} className={cn("rounded-lg border transition-colors", on && "border-blue-600 ring-1 ring-blue-600")}>
            <button type="button" role="radio" aria-checked={on} onClick={() => setScope(s)} className="flex w-full items-start gap-3 px-3.5 py-3 text-left">
              <span className={cn("mt-0.5 grid size-4 flex-none place-items-center rounded-full border", on && "border-blue-600")}>
                {on ? <i className="size-2 rounded-full bg-blue-600" /> : null}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{SCOPE_LABEL[s]}</span>
                <span className="text-[13px] text-muted-foreground">{SCOPE_SUB[s]}</span>
              </span>
            </button>
            {on && s === "all" ? (
              <div className="flex flex-col gap-1.5 px-3.5 pb-3.5 pl-10">
                <Label htmlFor={`${idPrefix}-range`} className="text-[13px]">
                  How far back
                </Label>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger id={`${idPrefix}-range`} className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RANGES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {on && s === "folders" ? (
              <div className="grid grid-cols-1 gap-1.5 px-3.5 pb-3.5 pl-10 sm:grid-cols-2">
                {FOLDERS.map((f) => (
                  <label key={f.name} className="flex items-center gap-2 text-[13px]">
                    <Checkbox
                      checked={folders.includes(f.name)}
                      onCheckedChange={(c) => setFolders(c === true ? [...folders, f.name] : folders.filter((x) => x !== f.name))}
                    />
                    <span className="flex-1">{f.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{f.count.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function InboxDialog({
  target,
  onOpenChange,
  onSave,
}: {
  target: InboxSource | "new" | null
  onOpenChange: (o: boolean) => void
  onSave: (i: InboxSource, isNew: boolean) => void
}) {
  const isNew = target === "new"
  const cur = target && target !== "new" ? target : null
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        {target ? <InboxForm key={cur?.address ?? "new"} cur={cur} isNew={isNew} onCancel={() => onOpenChange(false)} onSave={onSave} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function InboxForm({
  cur,
  isNew,
  onCancel,
  onSave,
}: {
  cur: InboxSource | null
  isNew: boolean
  onCancel: () => void
  onSave: (i: InboxSource, isNew: boolean) => void
}) {
  const [address, setAddress] = useState(cur?.address ?? "")
  const [provider, setProvider] = useState<InboxSource["provider"]>(cur?.provider ?? "Gmail")
  const [scope, setScope] = useState<ReadScope>(cur?.scope ?? "all")
  const [range, setRange] = useState<string>(cur?.range ?? "Last 6 months")
  const [folders, setFolders] = useState<string[]>(cur?.folders ?? ["Inbox", "Customer service"])
  const [agent, setAgent] = useState(cur?.agent ?? "Email and texts")

  const save = () => {
    const addr = address.trim() || "dispatch@example.test"
    onSave(
      {
        address: addr,
        provider,
        scope,
        range: scope === "all" ? range : undefined,
        folders: scope === "folders" ? folders : undefined,
        agent: agent === "new" ? `Email · ${addr.split("@")[0]}` : agent,
        agentHref: "/agents/op",
        state: scope === "new" ? "watching" : "reading",
        read: 0,
        total: scope === "new" ? undefined : 1200,
        since: "Connected just now by Taylor Morgan",
      },
      isNew
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isNew ? "Add an inbox" : cur!.address}</DialogTitle>
        <DialogDescription>
          {isNew ? "The Operator reads it to learn what your team does. Nothing is sent until you say so." : "Change what the Operator reads from this inbox."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-1 text-sm">
        {isNew ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Sign in with</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["Gmail", "Microsoft 365"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={cn("rounded-lg border px-3 py-2.5 text-left font-medium", provider === p && "border-blue-600 ring-1 ring-blue-600")}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inbox-address">Inbox address</Label>
              <Input id="inbox-address" placeholder="dispatch@example.test" value={address} onChange={(e) => setAddress(e.target.value)} />
              <span className="text-xs text-muted-foreground">A shared team inbox works best.</span>
            </div>
          </>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label>What should it read?</Label>
          <ScopePicker scope={scope} setScope={setScope} range={range} setRange={setRange} folders={folders} setFolders={setFolders} idPrefix="inbox" />
        </div>
        {isNew ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inbox-agent">Who answers it</Label>
            <Select value={agent} onValueChange={setAgent}>
              <SelectTrigger id="inbox-agent" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Email and texts">Email and texts (same agent as your other inboxes)</SelectItem>
                <SelectItem value="new">A new agent, just for this inbox</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Pick a new agent when this inbox is a different desk, like claims or dispatch.</span>
          </div>
        ) : null}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={save}>{isNew ? "Connect inbox" : "Save"}</Button>
      </DialogFooter>
    </>
  )
}
