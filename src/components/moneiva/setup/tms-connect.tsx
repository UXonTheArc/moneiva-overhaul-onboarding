"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Check, Eye, KeyRound, Loader, Lock, Pencil, Plug, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Connecting a TMS, faked end to end: pick the system, sign in (a sign-in window for cloud systems,
 * or a server address and API key for ones that run on your own servers), test it, then choose what it may do.
 */

export type TmsAccess = "read" | "write"
export type TmsLink = { name: string; access: TmsAccess; shipments: number }

type Tms = { name: string; sub: string; how: "signin" | "key" }
const SYSTEMS: Tms[] = [
  { name: "McLeod LoadMaster", sub: "Runs on your servers · API key", how: "key" },
  { name: "MercuryGate", sub: "Cloud · sign in", how: "signin" },
  { name: "Turvo", sub: "Cloud · sign in", how: "signin" },
  { name: "Revenova", sub: "Cloud · sign in", how: "signin" },
  { name: "Other TMS", sub: "Any system with an API · API key", how: "key" },
]

const CHECKS = ["Reaching your TMS", "Checking the login", "Reading recent shipments", "Counting shipments"]
const SHIPMENTS = 12480

type Stage = "pick" | "signin" | "key" | "testing" | "access"

/** The row on the Phone and systems step. */
export function TmsRow({ link, onConnect, onRemove }: { link: TmsLink | null; onConnect: () => void; onRemove: () => void }) {
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border bg-background px-4 py-3.5">
      <span className="grid size-9 flex-none place-items-center rounded-lg bg-muted text-muted-foreground">
        <Plug className="size-4" />
      </span>
      <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
        <span className="font-medium">{link ? `Connected to ${link.name}` : "Connect your TMS"}</span>
        {link ? (
          <span className="mt-0.5 inline-flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Check className="size-3" /> {link.shipments.toLocaleString()} shipments found ·{" "}
            {link.access === "read" ? "Look up only" : "Look up and update"} · login saved in Credentials
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">
            Lets it look up pickups, PROs and delivery dates. Without it, it can only learn, not answer.
          </span>
        )}
      </span>
      {link ? (
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onConnect}>
            Change
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </span>
      ) : (
        <Button variant="outline" size="sm" onClick={onConnect}>
          Connect
        </Button>
      )}
    </div>
  )
}

export function TmsDialog({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (l: TmsLink) => void }) {
  const [stage, setStage] = useState<Stage>("pick")
  const [tms, setTms] = useState<Tms | null>(null)
  const [server, setServer] = useState("https://tms.acme.example.test")
  const [user, setUser] = useState("moneiva-api")
  const [key, setKey] = useState("sk_live_4f9a2c7e81b3")
  const [done, setDone] = useState(0)
  const [access, setAccess] = useState<TmsAccess>("read")
  const [mailed, setMailed] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const test = () => {
    setStage("testing")
    setDone(0)
    CHECKS.forEach((_, i) => timers.current.push(setTimeout(() => setDone(i + 1), 700 * (i + 1))))
    timers.current.push(setTimeout(() => setStage("access"), 700 * CHECKS.length + 600))
  }

  const back = () => setStage(stage === "access" ? (tms?.how === "key" ? "key" : "signin") : "pick")
  const busy = stage === "testing"

  const title = {
    pick: "Which TMS do you use?",
    signin: `Sign in to ${tms?.name}`,
    key: `Connect ${tms?.name}`,
    testing: "Testing the connection",
    access: "What can it do in your TMS?",
  }[stage]
  const desc = {
    pick: "It looks up shipments for customers. Pick yours and we'll show you what it needs.",
    signin: "to let Moneiva look up your shipments",
    key: "Ask your IT admin for these. They're stored encrypted and only used to reach your TMS.",
    testing: tms?.name ?? "",
    access: "You can change this later in Credentials.",
  }[stage]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {stage === "signin" ? `${tms?.name} sign in` : "Connect your TMS"}
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        {stage === "pick" ? (
          <ul className="flex flex-col divide-y rounded-lg border">
            {SYSTEMS.map((t) => (
              <li key={t.name}>
                <button
                  type="button"
                  onClick={() => {
                    setTms(t)
                    setStage(t.how)
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm hover:bg-muted/50"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-muted text-xs font-semibold">{t.name[0]}</span>
                  <span className="flex flex-col">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.sub}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {stage === "signin" ? (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tms-user">Work email</Label>
              <Input id="tms-user" defaultValue="taylor@example.test" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tms-pass">Password</Label>
              <Input id="tms-pass" type="password" defaultValue="demo-password" />
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-muted/50 px-3.5 py-3">
              <span className="text-[13px] font-medium">Moneiva will be able to</span>
              {["See loads, stops and tracking events", "See customer and carrier contacts"].map((t) => (
                <span key={t} className="flex items-center gap-2 text-[13px]">
                  <Check className="size-3.5 text-green-600" /> {t}
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> Your password goes only to {tms?.name}. You can remove access at any time.
            </span>
            <Footer onBack={back} onNext={test} next="Sign in and allow" />
          </div>
        ) : null}

        {stage === "key" ? (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tms-server">Server address</Label>
              <Input id="tms-server" value={server} onChange={(e) => setServer(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tms-u">API user</Label>
                <Input id="tms-u" value={user} onChange={(e) => setUser(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tms-key">API key</Label>
                <Input id="tms-key" type="password" value={key} onChange={(e) => setKey(e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMailed(true)}
              className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-blue-700 hover:underline dark:text-blue-300"
            >
              {mailed ? <Check className="size-3.5" /> : <Send className="size-3.5" />}
              {mailed ? "Sent the steps to your IT admin" : "Don't have these? Send the steps to your IT admin"}
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <KeyRound className="size-3" /> Stored encrypted in Credentials.
            </span>
            <Footer onBack={back} onNext={test} next="Test connection" disabled={!server || !user || !key} />
          </div>
        ) : null}

        {stage === "testing" ? (
          <ul className="flex flex-col gap-3 py-2 text-sm">
            {CHECKS.map((c, i) => (
              <li key={c} className={cn("flex items-center gap-2.5", i > done && "text-muted-foreground")}>
                {i < done ? (
                  <Check className="size-4 text-green-600" />
                ) : i === done ? (
                  <Loader className="size-4 animate-spin text-blue-600" />
                ) : (
                  <span className="size-4 rounded-full border" />
                )}
                {c}
                {i === 3 && done > 3 ? <span className="ml-auto text-xs text-muted-foreground tabular-nums">{SHIPMENTS.toLocaleString()} shipments</span> : null}
              </li>
            ))}
          </ul>
        ) : null}

        {stage === "access" ? (
          <div className="flex flex-col gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-[13px] font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
              <Check className="size-4" /> Connected · {SHIPMENTS.toLocaleString()} shipments found
            </span>
            <div className="flex flex-col gap-2" role="radiogroup">
              {(
                [
                  ["read", Eye, "Look things up only", "Pickups, PROs, delivery dates and tracking. It changes nothing.", "Recommended to start"],
                  ["write", Pencil, "Look up and update", "Also adds notes and updates statuses, after your team approves each kind of request.", ""],
                ] as const
              ).map(([v, Icon, t, sub, tag]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={access === v}
                  onClick={() => setAccess(v)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left",
                    access === v ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 dark:bg-blue-950/40" : "hover:bg-muted/40"
                  )}
                >
                  <Icon className="mt-0.5 size-4 flex-none text-muted-foreground" />
                  <span className="flex flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {t}
                      {tag ? <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tag}</span> : null}
                    </span>
                    <span className="text-[13px] text-muted-foreground">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <Footer onBack={back} onNext={() => tms && onConnected({ name: tms.name, access, shipments: SHIPMENTS })} next="Done" />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Footer({ onBack, onNext, next, disabled }: { onBack: () => void; onNext: () => void; next: string; disabled?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>
      <Button onClick={onNext} disabled={disabled}>
        {next}
      </Button>
    </div>
  )
}
