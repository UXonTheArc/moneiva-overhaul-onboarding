"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Bot, Check } from "lucide-react"
import { toast } from "sonner"

import { REQUEST_TYPES, STAGES, type RequestType, type Stage } from "@/lib/moneiva/data"
import { ToneBadge } from "@/components/moneiva/status"
import { StageMeter } from "@/components/moneiva/home/stage-meter"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const COLS: Record<Stage, { total: string; desc: string }> = {
  Learn: { total: "82 emails not understood yet", desc: "Reads your history and docs. Nothing is sent." },
  Shadow: { total: "40 emails watched", desc: "Predicts what your team will do. Nothing is sent." },
  Review: { total: "17 of 37 replies approved as written", desc: "Drafts each reply. Nothing goes out until someone approves." },
  Autopilot: { total: "Nothing handled alone yet", desc: "Handles it end to end. Exceptions still come to your Inbox." },
}

/** The three new request types waiting for a name link to Inbox items n1, n2 and n3, in order. */
const NAME_LINK: Record<string, string> = Object.fromEntries(
  REQUEST_TYPES.filter((t) => t.stage === "Learn").map((t, i) => [t.name, `/inbox?item=n${i + 1}`])
)

const NEXT: Record<Stage, Stage | null> = { Learn: "Shadow", Shadow: "Review", Review: "Autopilot", Autopilot: null }

function TypeCard({ t, nameHref, onMove }: { t: RequestType; nameHref: string; onMove: (t: RequestType) => void }) {
  if (t.stage === "Learn") {
    return (
      <div className="flex flex-none flex-col gap-1 rounded-xl border bg-card px-3.5 py-3">
        <span className="text-[13px] text-muted-foreground">Suggested name</span>
        <span className="font-medium">{t.name}</span>
        <span className="text-[13px] text-muted-foreground">New · e.g. &quot;{t.line}&quot;</span>
        <Link href={nameHref} className="mt-1 self-start">
          <ToneBadge tone="amber" className="hover:underline">Needs a name</ToneBadge>
        </Link>
      </div>
    )
  }
  const pct = t.of ? Math.round((100 * t.matched) / t.of) : 0
  const word = t.stage === "Shadow" ? "matched" : "approved"
  return (
    <div className="flex flex-none flex-col gap-2 rounded-xl border bg-card px-3.5 py-3">
      <div className="flex justify-between gap-2">
        <Link href={`/playbook?type=${encodeURIComponent(t.name)}`} className="font-medium hover:underline">
          {t.name}
        </Link>
        <span className="whitespace-nowrap text-[13px] text-muted-foreground">
          {t.matched} of {t.of} {word}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      {t.flag === "ready" && NEXT[t.stage] ? (
        <button type="button" onClick={() => onMove(t)} className="self-start">
          <ToneBadge tone="blue" className="cursor-pointer hover:underline">
            Ready for {NEXT[t.stage]}
          </ToneBadge>
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">{t.line}</span>
      )}
    </div>
  )
}

export function StageBoard({ initialMove }: { initialMove?: string }) {
  const [types, setTypes] = React.useState<RequestType[]>(REQUEST_TYPES)
  const ready = types.find((t) => t.flag === "ready")
  const [moving, setMoving] = React.useState<RequestType | null>(initialMove && ready ? ready : null)

  const setMoveParam = (on: boolean) => {
    const url = new URL(window.location.href)
    if (on) url.searchParams.set("move", "pro")
    else url.searchParams.delete("move")
    window.history.replaceState(null, "", url.pathname + url.search)
  }

  const open = (t: RequestType) => {
    setMoving(t)
    setMoveParam(true)
  }
  const close = () => {
    setMoving(null)
    setMoveParam(false)
  }
  const confirm = () => {
    if (!moving) return
    const to = NEXT[moving.stage]
    if (!to) return
    setTypes((all) => {
      const rest = all.filter((t) => t.name !== moving.name)
      const moved: RequestType = { ...moving, stage: to, matched: 0, of: 0, flag: "", line: "Just moved. No replies yet" }
      return [moved, ...rest]
    })
    toast.success(`"${moving.name}" moved to ${to}`, {
      description: "It drafts a reply for each email. Nothing is sent until someone approves it.",
    })
    close()
  }

  const to = moving ? NEXT[moving.stage] : null
  const shortName = moving ? moving.name.replace(/ request$/, "") : ""

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const ts = types.filter((t) => t.stage === stage)
          return (
            <div key={stage} className="flex min-w-0 flex-col gap-2.5 rounded-xl border bg-zinc-50 p-3.5 text-sm dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StageMeter stage={stage} />
                  <span className="font-semibold">{stage}</span>
                </div>
                <span className="whitespace-nowrap text-[13px] text-muted-foreground">{ts.length} request types</span>
              </div>
              <span className="text-[13px] font-medium">{COLS[stage].total}</span>
              <span className="min-h-9 text-[13px] text-muted-foreground">{COLS[stage].desc}</span>
              <div className="-mr-1 flex h-[420px] flex-col gap-2.5 overflow-y-auto pr-1">
                {ts.length ? (
                  ts.map((t) => (
                    <TypeCard key={t.name} t={t} nameHref={NAME_LINK[t.name] ?? "/inbox"} onMove={open} />
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-4 py-7 text-center dark:border-zinc-700">
                    <Bot className="size-[18px] text-zinc-400" aria-hidden />
                    <span className="font-medium">Nothing on Autopilot yet</span>
                    <span className="text-[13px] text-muted-foreground">
                      A request type moves here once your team approves enough of its replies.
                    </span>
                  </div>
                )}
              </div>
              <Button asChild variant="ghost" size="sm" className="self-start px-2">
                <Link href={`/playbook?stage=${stage}`}>
                  See {stage} in Playbook
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          )
        })}
      </div>

      <Dialog open={!!moving} onOpenChange={(o) => (o ? null : close())}>
        <DialogContent className="sm:max-w-[512px]">
          <DialogHeader>
            <DialogTitle>
              Move &quot;{moving?.name}&quot; to {to}?
            </DialogTitle>
            {moving && to ? (
              <DialogDescription asChild>
                <div className="flex items-center gap-2 text-[13px]">
                  <StageMeter stage={moving.stage} />
                  <span>{moving.stage}</span>
                  <ArrowRight className="size-3.5" aria-hidden />
                  <StageMeter stage={to} />
                  <span className="font-medium text-foreground">{to}</span>
                </div>
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="flex flex-col gap-1 rounded-lg border bg-muted px-4 py-3 text-sm">
            <span className="font-medium">
              While shadowing, it would have proposed the right step on {moving?.matched} of {moving?.of} emails.
            </span>
            <span className="text-[13px] text-muted-foreground">[Your bar to move up, e.g. 20 emails at 90% or better]</span>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {[
              `It drafts a reply for each ${shortName} email.`,
              "Nothing is sent until someone on your team approves it.",
              `You can move it back to ${moving?.stage} any time.`,
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <Check className="size-4 flex-none text-primary" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Not yet
            </Button>
            <Button onClick={confirm}>Move to {to}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Reads ?move=pro so the Move up dialog can be deep linked. */
export function StageBoardFromParams() {
  const sp = useSearchParams()
  return <StageBoard initialMove={sp.get("move") ?? undefined} />
}
