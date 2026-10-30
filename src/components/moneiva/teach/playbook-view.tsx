"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  History,
  Plus,
  PlusCircle,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/moneiva/page-header"
import { DOCS, ME, REQUEST_TYPES, RULES, STAGES, type RequestType, type Rule, type Stage } from "@/lib/moneiva/data"
import { FACT_COUNT, KNOWS, LEARN_INBOX_ITEM } from "@/lib/moneiva/playbook-data"
import { RuleDialog, type NewRule } from "./dialogs"
import { DocumentsTab } from "./documents-tab"
import { StageMeter } from "./stage-meter"

export type PlaybookTab = "types" | "rules" | "documents"
type StageFilter = "All" | Stage

const ALL_TYPES = "All request types"
const TODAY = "Oct 16"

function buildUrl(tab: PlaybookTab, stage: StageFilter, sel: string | null) {
  const p = new URLSearchParams()
  if (tab !== "types") p.set("tab", tab)
  else {
    if (stage !== "All") p.set("stage", stage)
    if (sel) p.set("type", sel)
  }
  const q = p.toString()
  return q ? `/playbook?${q}` : "/playbook"
}

export function PlaybookView({
  initialTab,
  initialStage,
  initialType,
  initialDoc = null,
}: {
  initialTab: PlaybookTab
  initialStage: StageFilter
  initialType: string | null
  initialDoc?: string | null
}) {
  const [types, setTypes] = useState<RequestType[]>(REQUEST_TYPES)
  const [rules, setRules] = useState<Rule[]>(RULES)
  const [tab, setTab] = useState<PlaybookTab>(initialTab)
  const [stage, setStage] = useState<StageFilter>(() => {
    const t = REQUEST_TYPES.find((x) => x.name === initialType)
    return t && initialStage !== "All" && t.stage !== initialStage ? t.stage : initialStage
  })
  const [sel, setSel] = useState<string | null>(() => {
    if (initialType && REQUEST_TYPES.some((t) => t.name === initialType)) return initialType
    if (initialStage === "All") return "ETA or status request"
    return REQUEST_TYPES.find((t) => t.stage === initialStage)?.name ?? null
  })
  const [openGroups, setOpenGroups] = useState<string[]>(
    initialStage === "All" && !initialType ? ["How carriers work"] : []
  )
  const [query, setQuery] = useState("")
  const [moveUpOpen, setMoveUpOpen] = useState(false)
  const [ruleFor, setRuleFor] = useState<string | null>(null)

  const sync = (t: PlaybookTab, s: StageFilter, n: string | null) => {
    window.history.replaceState(null, "", buildUrl(t, s, n))
  }
  const changeTab = (t: PlaybookTab) => {
    setTab(t)
    sync(t, stage, sel)
  }
  const pickStage = (s: StageFilter) => {
    const first = types.find((t) => s === "All" || t.stage === s)?.name ?? null
    setStage(s)
    setSel(first)
    setQuery("")
    sync("types", s, first)
  }
  const pickType = (name: string) => {
    setSel(name)
    sync("types", stage, name)
  }

  const visible = types.filter(
    (t) => (stage === "All" || t.stage === stage) && t.name.toLowerCase().includes(query.trim().toLowerCase())
  )
  const cur = types.find((t) => t.name === sel && (stage === "All" || t.stage === stage)) ?? null

  const moveTo = (name: string, to: Stage) => {
    setTypes((all) =>
      all.map((t) =>
        t.name === name
          ? {
              ...t,
              stage: to,
              flag: "",
              matched: 0,
              of: 0,
              line: to === "Review" ? "Just moved. Its replies now wait for approval in Inbox." : "Just moved here.",
            }
          : t
      )
    )
    if (stage !== "All") {
      setStage(to)
      sync("types", to, name)
    }
    toast.success(`${name} moved to ${to}`)
  }

  const addRule = (r: NewRule) => {
    setRules((all) => [
      { text: r.text, requestType: r.requestType, source: "Added by hand", by: ME.name, on: TODAY, active: true },
      ...all,
    ])
    setRuleFor(null)
    toast.success("Rule saved", { description: `It applies to ${r.requestType}.` })
  }

  return (
    <>
      <PageHeader
        title="Playbook"
        description="How your team handles each request, and what the Operator is allowed to do."
        actions={
          <Button variant="ghost" size="sm" onClick={() => toast("Version history", { description: "Every change to the Playbook is saved. Not part of this mockup yet." })}>
            <History />
            Version history
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => changeTab(v as PlaybookTab)} className="gap-5 text-sm">
        <TabsList className="max-w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-none">
          <TabsTrigger value="types" className="px-3">
            Request types <CountBadge n={types.length} />
          </TabsTrigger>
          <TabsTrigger value="rules" className="px-3">
            Rules <CountBadge n={rules.length} />
          </TabsTrigger>
          <TabsTrigger value="documents" className="px-3">
            Documents <CountBadge n={DOCS.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="flex flex-col gap-5">
          <div role="group" aria-label="Filter by stage" className="flex flex-wrap items-center gap-2">
            {(["All", ...STAGES] as StageFilter[]).map((s) => {
              const n = s === "All" ? types.length : types.filter((t) => t.stage === s).length
              const on = stage === s
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickStage(s)}
                  className={cn(
                    "inline-flex h-[30px] items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                    on
                      ? "border-sidebar-accent bg-sidebar-accent text-sidebar-accent-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {s}
                  <span className="opacity-70">{n}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col items-start gap-5 lg:flex-row">
            <Card className="w-full gap-0.5 p-3 lg:w-80 lg:shrink-0">
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Find a request type"
                  placeholder="Find a request type"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {visible.map((t) => {
                const on = cur?.name === t.name
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => pickType(t.name)}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "flex min-h-[34px] w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                      on ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "hover:bg-muted"
                    )}
                  >
                    <span>{t.name}</span>
                    <StageMeter stage={t.stage} />
                  </button>
                )
              })}
              {visible.length === 0 ? (
                <span className="px-2.5 py-3 text-[13px] text-muted-foreground">
                  {query ? "No request types match." : "No request types in this stage yet."}
                </span>
              ) : null}
            </Card>

            <div className="flex w-full min-w-0 flex-1 flex-col gap-5">
              {cur ? (
                <>
                  <TypeDetail
                    t={cur}
                    onMoveUp={() => setMoveUpOpen(true)}
                    onChangeStage={(to) => moveTo(cur.name, to)}
                  />
                  <RulesThatApply t={cur} rules={rules} onAdd={() => setRuleFor(cur.name)} />
                  <WhatItKnows open={openGroups} setOpen={setOpenGroups} />
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-12 text-center">
                  <Bot className="mb-1 size-[18px] text-muted-foreground/70" />
                  <span className="font-medium">
                    {stage === "All" ? "Pick a request type" : `Nothing on ${stage} yet`}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {stage === "Autopilot"
                      ? "A request type moves here once your team approves enough of its replies in Review."
                      : "Request types show up here as the Operator moves them along."}
                  </span>
                  {stage === "Autopilot" ? (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => pickStage("Review")}>
                      See what is in Review
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <RulesTab rules={rules} setRules={setRules} onAdd={() => setRuleFor(ALL_TYPES)} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab initialDoc={initialDoc} />
        </TabsContent>
      </Tabs>

      {cur ? <MoveUpDialog open={moveUpOpen} onOpenChange={setMoveUpOpen} t={cur} onConfirm={() => {
        setMoveUpOpen(false)
        moveTo(cur.name, STAGES[STAGES.indexOf(cur.stage) + 1])
      }} /> : null}

      <RuleDialog
        open={ruleFor !== null}
        onOpenChange={(o) => !o && setRuleFor(null)}
        requestType={ruleFor ?? ALL_TYPES}
        onSave={addRule}
      />
    </>
  )
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-[18px] min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-foreground/80 group-data-[state=active]:bg-muted">
      {n}
    </span>
  )
}

/* ---------------- Request type detail ---------------- */

function TypeDetail({
  t,
  onMoveUp,
  onChangeStage,
}: {
  t: RequestType
  onMoveUp: () => void
  onChangeStage: (to: Stage) => void
}) {
  const idx = STAGES.indexOf(t.stage)
  const isShadow = t.stage === "Shadow"
  const measured = isShadow || t.stage === "Review"
  const pct = t.of ? Math.round((100 * t.matched) / t.of) : 0
  const inboxItem = LEARN_INBOX_ITEM[t.name]
  return (
    <Card className="gap-5 px-6 py-[22px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">{t.name}</h2>
          <span className="text-muted-foreground">
            {t.stage === "Learn"
              ? "New request type the Operator found"
              : `${REQUEST_TYPES.find((x) => x.name === t.name)?.of ?? t.of} emails in the last 30 days`}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/activity">See emails</Link>
          </Button>
          {t.flag === "ready" ? (
            <Button size="sm" onClick={onMoveUp}>
              Move to {STAGES[idx + 1]}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Change stage
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Move this request type to</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={t.stage} onValueChange={(v) => v !== t.stage && onChangeStage(v as Stage)}>
                  {STAGES.map((s) => (
                    <DropdownMenuRadioItem key={s} value={s}>
                      <span className="flex flex-1 items-center justify-between gap-2">
                        {s}
                        <StageMeter stage={s} />
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div role="list" aria-label="Stage" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((s, i) => (
          <div key={s} role="listitem" className="flex flex-col gap-1">
            <span className={cn("mb-1.5 h-1 rounded-full", i <= idx ? "bg-primary" : "bg-gray-200 dark:bg-gray-700")} />
            <span className="text-[13px] font-medium">{s}</span>
            <span className="text-xs text-muted-foreground">{i < idx ? "Done" : i === idx ? "Current stage" : "Not yet"}</span>
          </div>
        ))}
      </div>

      {t.stage === "Learn" ? (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-[18px] py-4 dark:border-amber-900 dark:bg-amber-950">
          <span className="font-semibold text-amber-800 dark:text-amber-200">Needs a name</span>
          <span>
            The Operator found a new kind of email, like &quot;{t.line}&quot;. Name it so the Operator can start shadowing your
            team on it.
          </span>
          <div>
            <Button size="sm" asChild>
              <Link href={inboxItem ? `/inbox?item=${inboxItem}` : "/inbox"}>Name it in Inbox</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {measured ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 px-[18px] py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold">{isShadow ? "Predictions that matched your team" : "Replies approved as written"}</span>
            <span className="text-[13px] text-muted-foreground">
              {isShadow ? "Moves to Review when your team says so" : "Goal for Autopilot: [your bar, e.g. 90% over 50 emails]"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200/70 dark:bg-gray-700">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-semibold">
              {t.matched} of {t.of}
            </span>
          </div>
          <span className="text-[13px] text-muted-foreground">{t.line}</span>
        </div>
      ) : null}

      {t.stage === "Autopilot" ? (
        <div className="rounded-lg border bg-muted/50 px-[18px] py-4 text-[13px] text-muted-foreground">{t.line}</div>
      ) : null}
    </Card>
  )
}

function RulesThatApply({ t, rules, onAdd }: { t: RequestType; rules: Rule[]; onAdd: () => void }) {
  const list = rules.filter((r) => r.requestType === t.name || r.requestType === ALL_TYPES)
  return (
    <Card className="gap-2.5 px-5 py-[18px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Rules that apply</span>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus />
          Add a rule
        </Button>
      </div>
      {list.map((r) => (
        <div key={r.text} className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-2.5">
          <span>{r.text}</span>
          <span className="text-xs text-muted-foreground">
            {r.requestType === ALL_TYPES ? `${ALL_TYPES} · ` : ""}
            {r.by} · {r.on}
          </span>
        </div>
      ))}
      {list.length === 0 ? (
        <span className="text-[13px] text-muted-foreground">
          No rules for this request type yet. Rules you save from a correction in Inbox show up here.
        </span>
      ) : null}
    </Card>
  )
}

function WhatItKnows({ open, setOpen }: { open: string[]; setOpen: (v: string[]) => void }) {
  const [all, setAll] = useState<string[]>([])
  return (
    <Card className="gap-0 px-5 py-[18px]">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">What it knows</span>
        <span className="text-[13px] text-muted-foreground">{FACT_COUNT} facts from your documents and email history</span>
      </div>
      {KNOWS.map((g) => {
        const isOpen = open.includes(g.name)
        const showAll = all.includes(g.name)
        const facts = showAll ? g.facts : g.facts.slice(0, 4)
        return (
          <Collapsible
            key={g.name}
            open={isOpen}
            onOpenChange={(o) => setOpen(o ? [...open, g.name] : open.filter((x) => x !== g.name))}
            className="border-t border-border/60 py-1"
          >
            <CollapsibleTrigger className="flex w-full items-center gap-2 py-2.5 text-sm">
              {isOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              <span className="flex-1 text-left font-medium">{g.name}</span>
              <span className="text-muted-foreground">{g.facts.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={cn(showAll && "max-h-[260px] overflow-y-auto")}>
                {facts.map((f) => (
                  <div key={f.text} className="flex flex-col gap-0.5 py-1.5 pl-6">
                    <span>{f.text}</span>
                    <span className="text-xs text-muted-foreground">{f.src}</span>
                  </div>
                ))}
              </div>
              {g.facts.length > 4 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-0.5 mb-1.5 ml-4"
                  onClick={() => setAll(showAll ? all.filter((x) => x !== g.name) : [...all, g.name])}
                >
                  {showAll ? "Show fewer" : `Show all ${g.facts.length}`}
                </Button>
              ) : null}
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </Card>
  )
}

function MoveUpDialog({
  open,
  onOpenChange,
  t,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  t: RequestType
  onConfirm: () => void
}) {
  const next = STAGES[STAGES.indexOf(t.stage) + 1] ?? t.stage
  const noun = t.name.replace(/ request$/, "")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            Move &quot;{t.name}&quot; to {next}?
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 text-[13px]">
              <StageMeter stage={t.stage} />
              <span>{t.stage}</span>
              <ArrowRight className="size-3.5" />
              <StageMeter stage={next} />
              <span className="font-medium text-foreground">{next}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1 rounded-lg border bg-muted/50 px-4 py-3">
          <span className="font-medium">
            While shadowing, it would have proposed the right step on {t.matched} of {t.of} emails.
          </span>
          <span className="text-[13px] text-muted-foreground">[Your bar to move up, e.g. 20 emails at 90% or better]</span>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {[
            `It drafts a reply for each ${noun} email.`,
            "Nothing is sent until someone on your team approves it.",
            `You can move it back to ${t.stage} any time.`,
          ].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Check className="size-4 text-primary" />
              {line}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not yet
          </Button>
          <Button onClick={onConfirm}>Move to {next}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- Rules tab ---------------- */

function FilterMenu({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <PlusCircle />
          {label}
          {value.length ? (
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {value.length}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o}
            checked={value.includes(o)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(c) => onChange(c ? [...value, o] : value.filter((x) => x !== o))}
          >
            {o}
          </DropdownMenuCheckboxItem>
        ))}
        {value.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => onChange([])} className="justify-center">
              Clear filter
            </DropdownMenuCheckboxItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RulesTab({
  rules,
  setRules,
  onAdd,
}: {
  rules: Rule[]
  setRules: (fn: (r: Rule[]) => Rule[]) => void
  onAdd: () => void
}) {
  const [q, setQ] = useState("")
  const [types, setTypes] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const typeOpts = useMemo(() => [...new Set(rules.map((r) => r.requestType))], [rules])
  const sourceOpts = useMemo(() => [...new Set(rules.map((r) => r.source))], [rules])
  const list = rules.filter(
    (r) =>
      r.text.toLowerCase().includes(q.trim().toLowerCase()) &&
      (!types.length || types.includes(r.requestType)) &&
      (!sources.length || sources.includes(r.source))
  )
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[360px] min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search rules" placeholder="Search rules" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <FilterMenu label="Request type" options={typeOpts} value={types} onChange={setTypes} />
        <FilterMenu label="Source" options={sourceOpts} value={sources} onChange={setSources} />
        <span className="flex-1" />
        <Button size="sm" onClick={onAdd}>
          <Plus />
          Add a rule
        </Button>
      </div>
      <span className="text-[13px] text-muted-foreground">
        Rules tell the Operator what to do, or never do, for a request type. When someone corrects a reply in Inbox and saves it as
        a rule, it shows up here.
      </span>
      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-3.5">Rule</TableHead>
              <TableHead className="w-[230px]">Applies to</TableHead>
              <TableHead className="w-[200px]">Source</TableHead>
              <TableHead className="w-[170px]">Added</TableHead>
              <TableHead className="w-[60px]">On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((r) => (
              <TableRow key={r.text}>
                <TableCell className="py-3 pl-3.5 align-top whitespace-normal">{r.text}</TableCell>
                <TableCell className="py-3 align-top whitespace-normal text-muted-foreground">
                  {r.requestType === ALL_TYPES ? (
                    r.requestType
                  ) : (
                    <Link href={`/playbook?type=${encodeURIComponent(r.requestType)}`} className="hover:text-foreground hover:underline">
                      {r.requestType}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="py-3 align-top text-muted-foreground">{r.source}</TableCell>
                <TableCell className="py-3 align-top text-muted-foreground">
                  {r.by} · {r.on}
                </TableCell>
                <TableCell className="py-3 align-top">
                  <Switch
                    aria-label={r.active ? "Turn rule off" : "Turn rule on"}
                    checked={r.active}
                    onCheckedChange={(c) => setRules((all) => all.map((x) => (x.text === r.text ? { ...x, active: c } : x)))}
                  />
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No rules match.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
