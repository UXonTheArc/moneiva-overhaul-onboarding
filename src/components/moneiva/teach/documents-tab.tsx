"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Check, FileText, Loader, Search, Undo2, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToneBadge } from "@/components/moneiva/status"
import { DOCS, ME, type Doc } from "@/lib/moneiva/data"
import { NEW_DOC, factsFrom } from "@/lib/moneiva/playbook-data"

type Fact = { text: string; group: string }
type Row = Doc & { learned: Fact[] }
type Check = "right" | "removed"

const START: Row[] = DOCS.map((d) => ({ ...d, learned: d.state === "Read" ? factsFrom(d.name) : [] }))

/**
 * Documents: what the Operator read. Each document opens to the exact facts it learned from it,
 * so the team can check them one by one. Email history lives in Training, the thing it feeds.
 */
export function DocumentsTab({ initialDoc = null }: { initialDoc?: string | null }) {
  const [rows, setRows] = useState<Row[]>(START)
  const [q, setQ] = useState("")
  // Deep link: /teach?tab=documents&doc=<file name>
  const [open, setOpen] = useState<string | null>(START.some((r) => r.name === initialDoc && r.state === "Read") ? initialDoc : null)
  const [checks, setChecks] = useState<Record<string, Check>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const list = rows.filter((d) => d.name.toLowerCase().includes(q.trim().toLowerCase()))
  const cur = rows.find((r) => r.name === open) ?? null

  const upload = () => {
    if (rows.some((r) => r.name === NEW_DOC.name)) {
      toast("Pick PDF, Word, Excel or plain text files.", { description: "This mockup uploads one sample file." })
      return
    }
    setRows((all) => [{ name: NEW_DOC.name, kind: NEW_DOC.kind, facts: "Reading", by: ME.name, on: "Today", state: "Reading", learned: [] }, ...all])
    timer.current = setTimeout(() => {
      setRows((all) =>
        all.map((r) => (r.name === NEW_DOC.name ? { ...r, state: "Read", facts: `${NEW_DOC.facts.length} facts`, learned: NEW_DOC.facts } : r))
      )
      toast.success(`Learned ${NEW_DOC.facts.length} facts from ${NEW_DOC.name}`, {
        description: "Check them before the Operator uses them.",
        action: { label: "Review", onClick: () => setOpen(NEW_DOC.name) },
      })
    }, 2500)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[360px] min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search documents" placeholder="Search documents" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <span className="flex-1" />
        <Button size="sm" onClick={upload}>
          <Upload />
          Upload documents
        </Button>
      </div>
      <span className="text-[13px] text-muted-foreground">
        What the Operator read to learn your business. Open a document to see each fact it learned, and fix anything that&apos;s wrong.
      </span>

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-3.5">Document</TableHead>
              <TableHead className="w-[130px]">Type</TableHead>
              <TableHead className="w-[200px]">What it learned</TableHead>
              <TableHead className="w-[180px]">Added</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((d) => {
              const reviewed = d.learned.filter((f) => checks[`${d.name}|${f.text}`]).length
              const read = d.state === "Read"
              return (
                <TableRow
                  key={d.name}
                  className={cn(read && "cursor-pointer")}
                  onClick={read ? () => setOpen(d.name) : undefined}
                >
                  <TableCell className="py-3 pl-3.5">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <FileText className="size-4 text-muted-foreground" />
                      {d.name}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-muted-foreground">{d.kind}</TableCell>
                  <TableCell className="py-3">
                    {read ? (
                      <span className="flex flex-col leading-snug">
                        <span className="font-medium text-blue-600 dark:text-blue-400">{d.facts}</span>
                        <span className="text-xs text-muted-foreground">
                          {reviewed === d.learned.length ? "All checked" : `${d.learned.length - reviewed} to check`}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Loader className="size-3.5 animate-spin" />
                        Still reading
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-muted-foreground">
                    {d.by} · {d.on}
                  </TableCell>
                  <TableCell className="py-3">
                    <ToneBadge tone={read ? "green" : "blue"}>{d.state}</ToneBadge>
                  </TableCell>
                </TableRow>
              )
            })}
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No documents match.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      <button
        type="button"
        onClick={upload}
        className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center hover:bg-muted/40"
      >
        <Upload className="size-[18px] text-muted-foreground/70" />
        <span className="font-medium">Drop files here to upload</span>
        <span className="text-[13px] text-muted-foreground">
          PDF, Word, Excel or plain text. The Operator reads each one and lists every fact it learned, for your team to check.
        </span>
      </button>


      <FactsSheet
        doc={cur}
        checks={checks}
        onCheck={(key, v) => setChecks((c) => ({ ...c, [key]: v }))}
        onUncheck={(key) =>
          setChecks((c) => {
            const n = { ...c }
            delete n[key]
            return n
          })
        }
        onClose={() => setOpen(null)}
      />
    </div>
  )
}

function FactsSheet({
  doc,
  checks,
  onCheck,
  onUncheck,
  onClose,
}: {
  doc: Row | null
  checks: Record<string, Check>
  onCheck: (key: string, v: Check) => void
  onUncheck: (key: string) => void
  onClose: () => void
}) {
  const facts = doc?.learned ?? []
  const key = (f: Fact) => `${doc?.name}|${f.text}`
  const groups = Array.from(new Set(facts.map((f) => f.group)))
  const done = facts.filter((f) => checks[key(f)]).length
  const left = facts.filter((f) => !checks[key(f)])

  return (
    <Sheet open={!!doc} onOpenChange={(o) => (o ? null : onClose())}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-[560px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="flex items-center gap-2 pr-6">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{doc?.name}</span>
          </SheetTitle>
          <SheetDescription>
            {facts.length} facts learned · {done} of {facts.length} checked. Remove anything that&apos;s wrong and the Operator stops using it.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {groups.map((g) => (
            <section key={g} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-muted-foreground">{g}</h3>
              <ul className="flex flex-col gap-2">
                {facts
                  .filter((f) => f.group === g)
                  .map((f) => {
                    const c = checks[key(f)]
                    return (
                      <li
                        key={f.text}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
                          c === "right" && "border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/40",
                          c === "removed" && "bg-muted/50"
                        )}
                      >
                        <span className={cn("flex-1 leading-snug", c === "removed" && "text-muted-foreground line-through")}>{f.text}</span>
                        {c ? (
                          <span className="flex shrink-0 items-center gap-2">
                            <span className={cn("text-xs", c === "right" ? "text-green-700 dark:text-green-400" : "text-muted-foreground")}>
                              {c === "right" ? "Looks right" : "Removed"}
                            </span>
                            <Button variant="ghost" size="icon" className="size-7" aria-label="Undo" onClick={() => onUncheck(key(f))}>
                              <Undo2 />
                            </Button>
                          </span>
                        ) : (
                          <span className="flex shrink-0 items-center gap-1">
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => onCheck(key(f), "right")}>
                              <Check />
                              Right
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-red-700 hover:text-red-700 dark:text-red-400"
                              onClick={() => onCheck(key(f), "removed")}
                            >
                              <X />
                              Remove
                            </Button>
                          </span>
                        )}
                      </li>
                    )
                  })}
              </ul>
            </section>
          ))}
        </div>
        <SheetFooter className="flex-row items-center justify-between border-t px-6 py-4">
          <Link href="/playbook" className="text-[13px] text-blue-600 hover:underline dark:text-blue-400">
            See everything it knows
          </Link>
          <Button size="sm" disabled={left.length === 0} onClick={() => left.forEach((f) => onCheck(key(f), "right"))}>
            Mark the rest as right
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
