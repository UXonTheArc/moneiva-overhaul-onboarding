"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Check, ChevronDown, Loader, MessageSquarePlus, Plus, Search, ThumbsDown, User } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader } from "@/components/moneiva/page-header"
import { ToneBadge, TONE_CLASS } from "@/components/moneiva/status"
import {
  KIND_BOX,
  LATEST_RUN,
  RUNS,
  TAB_COPY,
  THREADS,
  WRONG_REASONS,
  type Thread,
  type TrainingPhase,
  type TrainingTab,
} from "@/lib/moneiva/training-data"
import { NotRightDialog, RuleDialog } from "./dialogs"
import { EmailSourceCard, ImportEmailDialog, TrainingEmpty, TrainingReading } from "./email-import"

type Sub = "thread" | "actions" | "learned"
type Verdict = "right" | "fixed"
type Pop = { key: string; kind: "down" | "note" } | null

const FIRST: Record<TrainingTab, string> = { history: "h1", shadow: "s1" }

const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

const AVATAR_BG = ["bg-blue-100", "bg-indigo-100", "bg-green-100", "bg-amber-100"]

function listLine(t: Thread) {
  if (t.kind === "nopred") return "No prediction"
  if (t.kind === "different" || t.kind === "mismatch") return "Your team did something different"
  if (t.kind === "new") return "New request type proposed"
  return t.type
}

export function TrainingView({
  initialTab,
  initialThread,
  initialPhase = "ready",
}: {
  initialTab: TrainingTab
  initialThread: string | null
  initialPhase?: TrainingPhase
}) {
  const [phase, setPhase] = useState<TrainingPhase>(initialPhase)
  const [importOpen, setImportOpen] = useState(false)
  const [tab, setTab] = useState<TrainingTab>(initialTab)
  const [run, setRun] = useState(LATEST_RUN)
  const [sel, setSel] = useState<string | null>(() => {
    const t = THREADS.find((x) => x.id === initialThread && x.tab === initialTab)
    return t ? t.id : FIRST[initialTab]
  })
  const [sub, setSub] = useState<Sub>("thread")
  const [verdict, setVerdict] = useState<Record<string, Verdict>>({})
  const [rules, setRules] = useState<Record<string, boolean>>({})
  const [wrong, setWrong] = useState<Record<string, string>>({})
  const [pop, setPop] = useState<Pop>(null)
  const [reason, setReason] = useState<string>(WRONG_REASONS[0])
  const [dialog, setDialog] = useState<"notright" | "rule" | null>(null)
  const [query, setQuery] = useState("")

  const isHistory = tab === "history"
  const copy = TAB_COPY[tab]
  const runChecked = isHistory && run !== LATEST_RUN
  const list = THREADS.filter((t) => t.tab === tab)
  const shown = list.filter((t) => t.subject.toLowerCase().includes(query.trim().toLowerCase()))
  const cur = runChecked ? null : (list.find((t) => t.id === sel) ?? null)

  const sync = (t: TrainingTab, id: string | null) => {
    const p = new URLSearchParams()
    if (t === "shadow") p.set("tab", "shadow")
    if (id && id !== FIRST[t]) p.set("thread", id)
    const q = p.toString()
    window.history.replaceState(null, "", q ? `/training?${q}` : "/training")
  }
  const select = (id: string | null) => {
    setSel(id)
    setSub("thread")
    setPop(null)
    sync(tab, id)
  }
  const changeTab = (t: TrainingTab) => {
    setTab(t)
    setSel(FIRST[t])
    setSub("thread")
    setPop(null)
    setQuery("")
    sync(t, FIRST[t])
  }
  const goNext = () => {
    const idx = list.findIndex((t) => t.id === sel)
    for (let k = 1; k <= list.length; k++) {
      const t = list[(idx + k + list.length) % list.length]
      if (t.group === "check" && !verdict[t.id]) {
        select(t.id)
        return
      }
    }
    select(null)
  }

  const importDialog = (
    <ImportEmailDialog
      open={importOpen}
      onOpenChange={setImportOpen}
      first={phase === "empty"}
      onImport={() => {
        if (phase === "empty") setPhase("reading")
        else toast.success("Import started", { description: "New threads show up under Check first as they're read." })
      }}
    />
  )

  if (phase !== "ready") {
    return (
      <>
        <PageHeader title="Training" description="Check what the Operator learned. Every fix makes it better at the next email." />
        {phase === "empty" ? (
          <TrainingEmpty onImport={() => setImportOpen(true)} />
        ) : (
          <>
            <EmailSourceCard reading onImport={() => setImportOpen(true)} />
            <TrainingReading />
          </>
        )}
        {importDialog}
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Training"
        description="Check what the Operator learned. Every fix makes it better at the next email."
        actions={
          isHistory ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    History check: {RUNS.find((r) => r.id === run)?.label}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Each check reads a batch of your past emails
                  </DropdownMenuLabel>
                  {RUNS.map((r) => (
                    <DropdownMenuItem
                      key={r.id}
                      onSelect={() => {
                        setRun(r.id)
                        select(r.id === LATEST_RUN ? FIRST.history : null)
                      }}
                      className="items-start gap-2.5 py-2"
                    >
                      <span className="mt-0.5 grid w-4 place-items-center">{r.id === run ? <Check className="size-4" /> : null}</span>
                      <span className="flex flex-1 flex-col leading-snug">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.sub}</span>
                      </span>
                      {r.latest ? <ToneBadge tone="blue">Latest</ToneBadge> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <i className="size-2 rounded-full bg-green-600" />
              Watching live email since Oct 1
            </span>
          )
        }
      />

      <Tabs value={tab} onValueChange={(v) => changeTab(v as TrainingTab)} className="-mt-1 gap-3">
        <TabsList className="max-w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-none">
          <TabsTrigger value="history" className="px-3">
            From history<span className="font-normal text-muted-foreground">· Learn</span>
          </TabsTrigger>
          <TabsTrigger value="shadow" className="px-3">
            From live email<span className="font-normal text-muted-foreground">· Shadow</span>
          </TabsTrigger>
        </TabsList>
        <span className="text-[13px] text-muted-foreground">{copy.hint}</span>
      </Tabs>

      {isHistory ? <EmailSourceCard reading={false} onImport={() => setImportOpen(true)} /> : null}

      <div className="flex flex-col items-start gap-5 text-sm lg:flex-row">
        <Card className="w-full gap-0 p-2.5 lg:w-80 lg:shrink-0">
          <div className="relative mx-1 mt-0.5 mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search threads"
              placeholder="Search threads"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {runChecked ? (
            <div className="flex flex-col items-center gap-1.5 px-3 py-4 text-center">
              <span className="font-medium">All checked</span>
              <span className="text-[13px] text-muted-foreground">Your team already checked every thread in this history check.</span>
              <Button
                variant="outline"
                size="sm"
                className="mt-1.5"
                onClick={() => {
                  setRun(LATEST_RUN)
                  select(FIRST.history)
                }}
              >
                Back to the latest check
              </Button>
            </div>
          ) : (
            (["check", "right"] as const).map((g, gi) => {
              const items = shown.filter((t) => t.group === g)
              return (
                <div key={g} className="flex flex-col">
                  <div
                    className={cn(
                      "flex items-center gap-2 border-y px-3 py-2 text-[13px] font-semibold",
                      gi === 0 && "border-t-0",
                      gi > 0 && "mt-1",
                      g === "check"
                        ? "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        : "bg-muted/60 text-foreground/80"
                    )}
                  >
                    <i className={cn("size-2 rounded-full", g === "check" ? "bg-amber-500" : "bg-emerald-500")} />
                    {copy.groups[g]}
                  </div>
                  {items.map((t) => {
                    const on = cur?.id === t.id
                    const v = verdict[t.id]
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => select(t.id)}
                        aria-current={on ? "true" : undefined}
                        className={cn(
                          "flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors",
                          on ? "bg-sidebar-accent" : "hover:bg-muted"
                        )}
                      >
                        <span className="flex w-full justify-between gap-2">
                          <span className="truncate font-medium">{t.subject}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{t.date}</span>
                        </span>
                        <span className="flex w-full justify-between gap-2">
                          <span className="text-[13px] text-muted-foreground">{listLine(t)}</span>
                          {v === "right" ? (
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-800 dark:text-emerald-300">
                              <Check className="size-3.5" />
                              Right
                            </span>
                          ) : v === "fixed" ? (
                            <span className="shrink-0 text-xs text-amber-800 dark:text-amber-300">Corrected</span>
                          ) : null}
                        </span>
                      </button>
                    )
                  })}
                  {items.length === 0 ? (
                    <span className="px-3 py-2.5 text-[13px] text-muted-foreground">No threads match.</span>
                  ) : null}
                </div>
              )
            })
          )}
        </Card>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          {cur ? (
            <ThreadDetail
              key={cur.id}
              t={cur}
              opLabel={copy.opLabel}
              sub={sub}
              setSub={(s) => {
                setSub(s)
                setPop(null)
              }}
              verdict={verdict[cur.id]}
              hasRule={!!rules[cur.id]}
              wrong={wrong}
              pop={pop}
              reason={reason}
              setReason={setReason}
              openPop={(p) => {
                setPop(p)
                if (p?.kind === "down") setReason(wrong[p.key] ?? WRONG_REASONS[0])
              }}
              savePop={() => {
                if (pop?.kind === "down") setWrong({ ...wrong, [pop.key]: reason })
                else toast.success("Note added", { description: "The Operator will use it as context." })
                setPop(null)
              }}
              onRight={() => setVerdict({ ...verdict, [cur.id]: "right" })}
              onNotRight={() => setDialog("notright")}
              onRule={() => setDialog("rule")}
              onNext={goNext}
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-12 text-center">
              <span className="font-medium">{runChecked ? "This history check is done" : "Nothing left to check here"}</span>
              <span className="text-[13px] text-muted-foreground">
                {runChecked
                  ? "Pick the latest check to see threads that still need a look."
                  : "Every thread that needed a look has been marked. The rest count as correct."}
              </span>
            </div>
          )}
        </div>
      </div>

      {cur ? (
        <>
          <NotRightDialog
            open={dialog === "notright"}
            onOpenChange={(o) => !o && setDialog(null)}
            requestType={cur.type}
            fix={cur.fix}
            onSave={(c) => {
              setVerdict({ ...verdict, [cur.id]: "fixed" })
              if (c.alsoRule) setRules({ ...rules, [cur.id]: true })
              setDialog(null)
              toast.success("Correction saved")
            }}
          />
          <RuleDialog
            open={dialog === "rule"}
            onOpenChange={(o) => !o && setDialog(null)}
            requestType={cur.type}
            when={cur.when}
            then={cur.then}
            onSave={() => {
              setRules({ ...rules, [cur.id]: true })
              setDialog(null)
              toast.success("Rule saved to Playbook")
            }}
          />
        </>
      ) : null}
      {importDialog}
    </>
  )
}

const BOX_CLASS = {
  red: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
  amber: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
  green: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950",
}
const BOX_TITLE = {
  red: "text-red-800 dark:text-red-200",
  amber: "text-amber-800 dark:text-amber-200",
  green: "text-emerald-800 dark:text-emerald-200",
}

function ThreadDetail({
  t,
  opLabel,
  sub,
  setSub,
  verdict,
  hasRule,
  wrong,
  pop,
  reason,
  setReason,
  openPop,
  savePop,
  onRight,
  onNotRight,
  onRule,
  onNext,
}: {
  t: Thread
  opLabel: string
  sub: Sub
  setSub: (s: Sub) => void
  verdict?: Verdict
  hasRule: boolean
  wrong: Record<string, string>
  pop: Pop
  reason: string
  setReason: (r: string) => void
  openPop: (p: Pop) => void
  savePop: () => void
  onRight: () => void
  onNotRight: () => void
  onRule: () => void
  onNext: () => void
}) {
  const box = KIND_BOX[t.kind]
  return (
    <>
      <Card className="gap-[18px] px-6 py-[22px]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium">{t.subject}</h2>
            <span className="text-muted-foreground">
              {t.from} · {t.emails.length} {t.emails.length === 1 ? "message" : "messages"} · {t.date}
            </span>
          </div>
          <ToneBadge tone="muted">{t.type}</ToneBadge>
        </div>

        <div className={cn("flex flex-col gap-2.5 rounded-lg border px-4 py-3.5", BOX_CLASS[box.tone])}>
          <span className={cn("font-semibold", BOX_TITLE[box.tone])}>{box.title}</span>
          {box.wouldLabel ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{box.wouldLabel}</span>
                <span>{t.would}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">What your team did</span>
                <span>{t.did}</span>
              </div>
            </div>
          ) : (
            <span>{t.did}</span>
          )}
        </div>

        {t.newName ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">The Operator proposed a new request type</span>
            <div className="flex flex-col gap-1 rounded-lg border px-3.5 py-3">
              <span className="font-semibold">{t.newName}</span>
              <span className="text-muted-foreground">{t.newDesc}</span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-medium">Is this right?</span>
          <Button size="sm" onClick={onRight}>
            <Check />
            Looks right
          </Button>
          <Button variant="outline" size="sm" onClick={onNotRight}>
            Not right
          </Button>
          <Button variant="ghost" size="sm" onClick={onRule}>
            <Plus />
            Make this a rule
          </Button>
        </div>
        {verdict === "right" ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-800 dark:text-emerald-300">
            <Check className="size-4" />
            Marked as right. It counts toward moving {t.type} up a stage.
          </span>
        ) : null}
        {verdict === "fixed" ? (
          <span className="text-[13px] text-amber-800 dark:text-amber-300">
            Correction saved. The Operator will use it on the next email like this.
          </span>
        ) : null}
        {hasRule ? (
          <span className="inline-flex items-center gap-1.5 text-[13px]">
            <Check className="size-4" />
            Rule saved to Playbook, under Rules.
            <Link href="/playbook?tab=rules" className="text-primary hover:underline">
              See rules
            </Link>
          </span>
        ) : null}
      </Card>

      <Tabs value={sub} onValueChange={(v) => setSub(v as Sub)} className="gap-4">
        <TabsList className="max-w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-none">
          <TabsTrigger value="thread" className="px-3">
            Email thread <Count n={t.emails.length} />
          </TabsTrigger>
          <TabsTrigger value="actions" className="px-3">
            Suggested actions <Count n={t.actions.length} />
          </TabsTrigger>
          <TabsTrigger value="learned" className="px-3">
            What it learned <Count n={t.learned.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thread" className="flex flex-col gap-2.5">
          {t.emails.map((e, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <Card className="gap-2.5 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback
                      className={cn(
                        "text-[11px] font-semibold text-gray-700",
                        e.isTeam ? "bg-sidebar-accent" : AVATAR_BG[i % AVATAR_BG.length]
                      )}
                    >
                      {initials(e.who)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="flex items-center gap-1.5 font-medium">
                      {e.who}
                      {e.isTeam ? <ToneBadge tone="blue">Your team</ToneBadge> : null}
                    </span>
                    <span className="text-xs text-muted-foreground">{e.addr}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{e.time}</span>
                </div>
                <div className="leading-normal whitespace-pre-line">{e.body}</div>
              </Card>
              <div className="mb-1 ml-[22px] flex flex-col gap-1.5 border-l-2 pl-4">
                {e.team ? (
                  <span className="inline-flex items-start gap-1.5 text-[13px]">
                    <User className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-medium">Your team: </span>
                      {e.team}
                    </span>
                  </span>
                ) : null}
                <span className="inline-flex items-start gap-1.5 text-[13px] text-muted-foreground">
                  <Loader className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    <span className="font-medium">{opLabel} </span>
                    {e.op}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="actions">
          <Card className="gap-0 px-4 py-1.5">
            {t.actions.map((a, i) => {
              const key = `${t.id}-${i}`
              const w = wrong[key]
              const open = pop?.key === key
              return (
                <Popover key={key} open={open} onOpenChange={(o) => !o && openPop(null)}>
                  <PopoverAnchor asChild>
                    <div className="flex items-center gap-2.5 border-b border-border/60 py-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="flex-1">{a.text}</span>
                      {w ? <ToneBadge tone="red">Marked wrong: {w}</ToneBadge> : null}
                      <ToneBadge tone="muted">{a.kind}</ToneBadge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Add a note"
                            className="text-muted-foreground hover:bg-sky-100 hover:text-blue-700 dark:hover:bg-sky-950 dark:hover:text-sky-300"
                            onClick={() => openPop({ key, kind: "note" })}
                          >
                            <MessageSquarePlus />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add a note - the Operator relearns from it</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Reject"
                            aria-pressed={!!w}
                            className={cn(
                              "text-muted-foreground hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300",
                              w && TONE_CLASS.red
                            )}
                            onClick={() => openPop({ key, kind: "down" })}
                          >
                            <ThumbsDown />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reject - this is wrong</TooltipContent>
                      </Tooltip>
                    </div>
                  </PopoverAnchor>
                  <PopoverContent align="end" className="flex w-80 flex-col gap-2.5 p-3.5">
                    <span className="font-medium">{pop?.kind === "note" ? "Say what is wrong or missing - the AI relearns from your note." : "What is wrong with this action?"}</span>
                    {pop?.kind === "down" ? (
                      <RadioGroup value={reason} onValueChange={setReason} className="gap-0.5">
                        {WRONG_REASONS.map((r) => (
                          <Label
                            key={r}
                            className="flex h-8 cursor-pointer items-center gap-2 rounded-sm px-2 text-[13px] font-normal hover:bg-muted"
                          >
                            <RadioGroupItem value={r} />
                            {r}
                          </Label>
                        ))}
                      </RadioGroup>
                    ) : null}
                    <Textarea
                      aria-label="Note"
                      placeholder={
                        pop?.kind === "note"
                          ? 'e.g. "It is dock D, not B - and they open the door ahead of arrival if you call."'
                          : "What should it have done? (optional)"
                      }
                      className="min-h-16 resize-none text-[13px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openPop(null)}>
                        Cancel
                      </Button>
                      {pop?.kind === "note" ? (
                        <Button size="sm" onClick={savePop}>
                          Save note
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={savePop}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )
            })}
            {t.actions.length === 0 ? (
              <span className="block border-b border-border/60 py-3 text-muted-foreground">No suggested actions for this thread.</span>
            ) : null}
            <span className="block py-2.5 text-xs text-muted-foreground">
              The note icon adds context without marking anything wrong. The thumbs down rejects just that one action.
            </span>
          </Card>
        </TabsContent>

        <TabsContent value="learned">
          <Card className="gap-0 px-4 py-1.5">
            {t.learned.map((l, i) => (
              <div key={i} className="flex flex-col gap-0.5 border-b border-border/60 py-3 last:border-b-0">
                <span className="text-xs text-muted-foreground">{l.label}</span>
                <span>{l.text}</span>
              </div>
            ))}
            {t.learned.length === 0 ? (
              <span className="py-3 text-muted-foreground">Nothing new learned from this thread.</span>
            ) : null}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">
          Anything you don&apos;t mark counts as correct. Next thread skips what you already marked.
        </span>
        <Button onClick={onNext}>
          Next thread
          <ArrowRight />
        </Button>
      </div>
    </>
  )
}

function Count({ n }: { n: number }) {
  return (
    <span className="inline-flex h-[18px] min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-foreground/80">
      {n}
    </span>
  )
}
