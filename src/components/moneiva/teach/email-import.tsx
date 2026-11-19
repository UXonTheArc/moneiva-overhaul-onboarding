"use client"

import Link from "next/link"
import { useState } from "react"
import { FileText, GraduationCap, Loader, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EMAIL_SOURCE } from "@/lib/moneiva/training-data"

const RANGES = ["Last 3 months", "Last 6 months", "Last 12 months"] as const

/** Import email history: the mailbox and how far back. It feeds Training, so it lives here. */
export function ImportEmailDialog({
  open,
  onOpenChange,
  first,
  onImport,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  first: boolean
  onImport: () => void
}) {
  const [range, setRange] = useState<string>(RANGES[1])
  const [skip, setSkip] = useState(true)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{first ? "Import your email history" : "Import more email"}</DialogTitle>
          <DialogDescription>
            The Operator reads past threads and works out what your team did with each one. Nothing is sent.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1 text-sm">
          <div className="flex flex-col gap-1.5">
            <Label>Mailbox</Label>
            <div className="flex items-center gap-2.5 rounded-md border px-3 py-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="flex-1">{EMAIL_SOURCE.mailbox}</span>
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="import-range">How far back</Label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger id="import-range" className="w-full">
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
            <span className="text-xs text-muted-foreground">
              {first ? "6 months is usually enough to cover every kind of request." : "Only threads it hasn't read yet are added."}
            </span>
          </div>
          <label className="flex items-start gap-2.5">
            <Checkbox checked={skip} onCheckedChange={(c) => setSkip(c === true)} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span>Skip threads your team never answered</span>
              <span className="text-xs text-muted-foreground">Newsletters, auto-replies and spam teach it nothing.</span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              onImport()
            }}
          >
            Start import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The email history that feeds Training: where it came from and how much has been read. */
export function EmailSourceCard({ reading, onImport }: { reading: boolean; onImport: () => void }) {
  return (
    <Card className="flex-row flex-wrap items-center gap-3.5 px-[18px] py-3.5">
      <span className="grid size-9 place-items-center rounded-lg bg-muted">
        <Mail className="size-4 text-muted-foreground" />
      </span>
      <div className="flex min-w-[240px] flex-1 flex-col gap-0.5">
        <span className="font-medium">Email history · {EMAIL_SOURCE.mailbox}</span>
        <span className="text-[13px] text-muted-foreground">{reading ? EMAIL_SOURCE.readingMeta : EMAIL_SOURCE.meta}</span>
      </div>
      {reading ? (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Loader className="size-3.5 animate-spin" />
          Reading
        </span>
      ) : (
        <Button variant="outline" size="sm" onClick={onImport}>
          Import more
        </Button>
      )}
    </Card>
  )
}

const STEPS = [
  { title: "Import your email history", sub: "Pick a mailbox and how far back. Nothing is sent." },
  { title: "The Operator reads it", sub: "For each thread it works out what your team did. About an hour for 6 months of email." },
  { title: "Your team checks its work", sub: "Threads where it would have done something different show up here first." },
]

/** Training before any email has been imported. */
export function TrainingEmpty({ onImport }: { onImport: () => void }) {
  return (
    <Card className="items-center gap-6 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-blue-50 dark:bg-blue-950">
        <GraduationCap className="size-6 text-blue-600 dark:text-blue-400" />
      </span>
      <div className="flex max-w-[520px] flex-col gap-1.5">
        <h2 className="text-lg font-semibold">Nothing to review yet</h2>
        <p className="text-muted-foreground">
          Teach is where your team checks the Operator&apos;s work before it does anything for real. It starts with your past
          email.
        </p>
      </div>
      <ol className="grid w-full max-w-[760px] gap-3 text-left sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col gap-1.5 rounded-lg border p-4">
            <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
            <span className="font-medium">{s.title}</span>
            <span className="text-[13px] text-muted-foreground">{s.sub}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col items-center gap-3">
        <Button onClick={onImport}>
          <Mail />
          Import email history
        </Button>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <FileText className="size-3.5" />
          Have a handbook or rate sheet? You can also
          <Link href="/teach?tab=documents" className="text-blue-600 hover:underline dark:text-blue-400">
            upload documents
          </Link>
        </span>
      </div>
    </Card>
  )
}

/** Training while the first import is being read. */
export function TrainingReading() {
  return (
    <div className="flex flex-col items-start gap-5 text-sm lg:flex-row">
      <Card className="w-full gap-2 p-3 lg:w-80 lg:shrink-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-1.5 px-1 py-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </Card>
      <Card className="w-full min-w-0 flex-1 items-center gap-4 px-6 py-12 text-center">
        <Loader className="size-6 animate-spin text-blue-600 dark:text-blue-400" />
        <div className="flex max-w-[440px] flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Reading your email history</h2>
          <p className="text-muted-foreground">
            {EMAIL_SOURCE.readingDone} of {EMAIL_SOURCE.readingTotal} threads read. Threads show up here as soon as they&apos;re
            ready, so you can start checking before it finishes.
          </p>
        </div>
        <div className="h-2 w-full max-w-[360px] overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${Math.round((EMAIL_SOURCE.readingDone / EMAIL_SOURCE.readingTotal) * 100)}%` }}
          />
        </div>
        <span className="text-[13px] text-muted-foreground">We&apos;ll email you when the first threads are ready to check.</span>
      </Card>
    </div>
  )
}
