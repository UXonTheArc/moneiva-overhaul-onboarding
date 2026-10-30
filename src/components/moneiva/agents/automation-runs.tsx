"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { Fragment } from "react"
import { toast } from "sonner"

import { ToneBadge } from "@/components/moneiva/status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RUNS, type RunStep } from "@/lib/moneiva/automations-data"
import { cn } from "@/lib/utils"

const NOTE_CLASS = {
  red: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 [&>strong]:text-red-800 dark:[&>strong]:text-red-200",
  amber: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 [&>strong]:text-amber-800 dark:[&>strong]:text-amber-200",
} as const

const STEP_N: Record<RunStep["state"], string> = {
  done: "border-border bg-card text-muted-foreground",
  fail: "border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  now: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  todo: "border-border bg-card text-zinc-400",
}

export function AutomationRuns({ result, open, onToggle }: { result: string; open: string[]; onToggle: (id: string) => void }) {
  const runs = RUNS.filter((r) => result === "All results" || r.result === result)
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 pl-4">
              <span className="sr-only">Open</span>
            </TableHead>
            <TableHead className="w-[150px]">Started</TableHead>
            <TableHead>Report</TableHead>
            <TableHead className="w-[190px]">Result</TableHead>
            <TableHead className="w-[130px]">Took</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((r) => {
            const isOpen = open.includes(r.id)
            return (
              <Fragment key={r.id}>
                <TableRow
                  className={cn("cursor-pointer", isOpen && "bg-muted/50")}
                  onClick={() => onToggle(r.id)}
                  aria-expanded={isOpen}
                >
                  <TableCell className="pl-4">
                    <button
                      type="button"
                      aria-label={isOpen ? `Hide steps for ${r.report}` : `Show steps for ${r.report}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggle(r.id)
                      }}
                      className="grid place-items-center text-muted-foreground"
                    >
                      <ChevronRight className={cn("size-4 transition-transform", isOpen && "rotate-90")} />
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.started}</TableCell>
                  <TableCell className={cn(isOpen && "font-medium")}>{r.report}</TableCell>
                  <TableCell>
                    <ToneBadge tone={r.tone}>{r.result}</ToneBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.took}</TableCell>
                </TableRow>
                {isOpen ? (
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={5} className="px-6 pt-1 pb-[18px] whitespace-normal sm:pl-16">
                      {r.note && (r.tone === "red" || r.tone === "amber") ? (
                        <div className={cn("mt-2 mb-1.5 flex flex-col gap-0.5 rounded-lg border px-3.5 py-2.5", NOTE_CLASS[r.tone])}>
                          <strong className="font-medium">{r.noteTitle}</strong>
                          <span>{r.note}</span>
                        </div>
                      ) : null}
                      <ol>
                        {r.steps.map((s, i) => (
                          <li key={i} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 border-b py-2.5 last:border-b-0">
                            <span className={cn("grid size-6 place-items-center rounded-full border text-xs", STEP_N[s.state])}>{i + 1}</span>
                            <div className="flex flex-col">
                              <span
                                className={cn(
                                  "font-medium",
                                  s.state === "fail" && "text-red-800 dark:text-red-300",
                                  s.state === "todo" && "text-zinc-400"
                                )}
                              >
                                {s.title}
                              </span>
                              <span className={cn("text-[13px] text-muted-foreground", s.state === "todo" && "text-zinc-400")}>{s.detail}</span>
                            </div>
                            <span
                              className={cn(
                                "text-[13px] text-muted-foreground",
                                s.state === "fail" && "text-red-800 dark:text-red-300",
                                s.state === "now" && "text-amber-700 dark:text-amber-300"
                              )}
                            >
                              {s.time}
                            </span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.actions.map((a) =>
                          a.href === "#rerun" ? (
                            <Button key={a.label} variant="outline" size="sm" onClick={() => toast("Fix the agent first. The phone number still can't place calls.")}>
                              {a.label}
                            </Button>
                          ) : (
                            <Button key={a.label} variant={a.primary ? "default" : "outline"} size="sm" asChild>
                              <Link href={a.href}>{a.label}</Link>
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            )
          })}
          {runs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No runs with this result in this period.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Card>
  )
}
