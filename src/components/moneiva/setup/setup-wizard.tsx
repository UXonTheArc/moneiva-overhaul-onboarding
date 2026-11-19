"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  Building2,
  Check,
  FileText,
  Loader,
  Lock,
  Mail,
  Phone,
  Plug,
  Plus,
  Sparkles,
  Upload,
  Users,
  Workflow,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScopePicker } from "@/components/moneiva/teach/sources"
import { FLOWS } from "@/lib/moneiva/agents-extra-data"
import { REQUEST_TYPES } from "@/lib/moneiva/data"
import { factsFrom } from "@/lib/moneiva/playbook-data"
import { FOLDERS, SCOPE_LABEL, type ReadScope } from "@/lib/moneiva/inbox-sources-data"
import { saveSetup, type SetupInbox, type SetupInvite, type SetupState } from "@/lib/moneiva/setup-store"

/**
 * First-run setup for a brand-new account. Every step is faked so a demo looks real:
 * signing in to each inbox, folders loading, invites sending, files uploading, then the Operator
 * reading the email and building its agent and workflow in front of the customer.
 */

const STEPS = [
  { key: "business", label: "Your business", icon: Building2 },
  { key: "team", label: "Your team", icon: Users },
  { key: "email", label: "Email", icon: Mail },
  { key: "systems", label: "Phone and systems", icon: Plug },
  { key: "docs", label: "Documents", icon: FileText },
  { key: "review", label: "Review", icon: Check },
] as const

type Provider = SetupInbox["provider"]
type Inbox = SetupInbox & { foldersShown: number }
type Invite = SetupInvite & { sent?: "sending" | "sent" }
type Doc = { name: string; size: string; facts: number; progress: number; state: "uploading" | "reading" | "read" }

const ACCOUNTS = ["service@example.test", "billing@example.test", "claims@example.test", "taylor@example.test"]
const SAMPLE_DOCS = [
  { name: "Northwind routing guide.pdf", size: "1.2 MB" },
  { name: "Acme rate and accessorial sheet.pdf", size: "340 KB" },
  { name: "Dock hours and addresses.xlsx", size: "88 KB" },
].map((d) => ({ ...d, facts: factsFrom(d.name).length }))

/** Threads an inbox will import, from what the customer picked. */
function threadsFor(i: Pick<SetupInbox, "scope" | "range" | "folders">) {
  if (i.scope === "new") return 0
  if (i.scope === "folders") return FOLDERS.filter((f) => i.folders.includes(f.name)).reduce((n, f) => n + f.count, 0)
  return { "Last 3 months": 640, "Last 6 months": 1240, "Last 12 months": 2480, Everything: 5120 }[i.range] ?? 1240
}

export function SetupWizard() {
  const [step, setStep] = useState(-1) // -1 welcome, 0..5 steps, 6 building, 7 done
  const [biz, setBiz] = useState({ name: "Acme Logistics", website: "acme.example.test", industry: "LTL freight", tz: "Central time (Chicago)", hours: "Weekdays, 7 AM to 6 PM", sign: "Customer Service Team" })
  const [invites, setInvites] = useState<Invite[]>([
    { email: "jordan@example.test", role: "Admin" },
    { email: "sam@example.test", role: "Team member" },
  ])
  const [sending, setSending] = useState(false)
  const [inboxes, setInboxes] = useState<Inbox[]>([])
  const [signIn, setSignIn] = useState<Provider | null>(null)
  const [openInbox, setOpenInbox] = useState(0)
  const [phone, setPhone] = useState(true)
  const [texts, setTexts] = useState(true)
  const [tms, setTms] = useState<"off" | "connecting" | "on">("off")
  const [docs, setDocs] = useState<Doc[]>([])

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => s - 1)

  // Folders appear one at a time after an inbox connects.
  useEffect(() => {
    const loading = inboxes.findIndex((i) => i.foldersShown < FOLDERS.length)
    if (loading < 0) return
    const t = setTimeout(() => setInboxes((all) => all.map((x, k) => (k === loading ? { ...x, foldersShown: x.foldersShown + 1 } : x))), 260)
    return () => clearTimeout(t)
  }, [inboxes])

  // Files upload, then get read.
  useEffect(() => {
    const busy = docs.findIndex((d) => d.state !== "read")
    if (busy < 0) return
    const t = setTimeout(() => {
      setDocs((all) =>
        all.map((d, k) => {
          if (k !== busy) return d
          if (d.state === "uploading") return d.progress >= 100 ? { ...d, state: "reading" } : { ...d, progress: Math.min(100, d.progress + 9) }
          return { ...d, state: "read" }
        })
      )
    }, docs[busy].state === "reading" ? 1100 : 70)
    return () => clearTimeout(t)
  }, [docs])

  const addInbox = (address: string, provider: Provider) => {
    setInboxes((all) => {
      setOpenInbox(all.length)
      return [...all, { address, provider, scope: "all", range: "Last 6 months", folders: ["Inbox", "Customer service"], threads: 0, foldersShown: 0 }]
    })
  }
  const patchInbox = (i: number, p: Partial<Inbox>) => setInboxes((all) => all.map((x, k) => (k === i ? { ...x, ...p } : x)))

  const sendInvites = () => {
    const list = invites.filter((i) => i.email.trim())
    if (!list.length) return next()
    setSending(true)
    list.forEach((_, n) => {
      setTimeout(() => setInvites((all) => all.map((x, k) => (k === n ? { ...x, sent: "sending" } : x))), n * 500)
      setTimeout(() => setInvites((all) => all.map((x, k) => (k === n ? { ...x, sent: "sent" } : x))), n * 500 + 450)
    })
    setTimeout(() => {
      setSending(false)
      next()
    }, list.length * 500 + 900)
  }

  const build = () => {
    const state: SetupState = {
      biz,
      invites: invites.filter((i) => i.email.trim()).map(({ email, role }) => ({ email, role })),
      inboxes: inboxes.map(({ foldersShown: _f, ...i }) => ({ ...i, threads: threadsFor(i) })),
      phone,
      texts,
      tms: tms === "on",
      docs: docs.map((d) => d.name),
      finishedAt: new Date().toISOString(),
    }
    saveSetup(state)
    next()
  }

  const docsBusy = docs.some((d) => d.state !== "read")

  if (step === 6)
    return <Building inboxes={inboxes.map((i) => ({ ...i, threads: threadsFor(i) }))} phone={phone} docs={docs} tms={tms === "on"} onDone={next} />
  if (step === 7) return <Done inboxes={inboxes.length} phone={phone} docs={docs.length} invites={invites.filter((i) => i.email.trim()).length} biz={biz.name} />

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <TopStrip />
      {step === -1 ? (
        <Welcome onStart={next} />
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-6 md:py-10">
          <Rail step={step} onGo={(i) => i < step && setStep(i)} />
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {step === 0 ? (
              <Panel title="Tell us about your business" sub="The Operator uses this to sign emails, keep business hours and sound like your team.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Company name" id="biz-name">
                    <Input id="biz-name" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
                  </Field>
                  <Field label="Website" id="biz-web">
                    <Input id="biz-web" value={biz.website} onChange={(e) => setBiz({ ...biz, website: e.target.value })} />
                  </Field>
                  <Field label="What you do" id="biz-ind">
                    <Pick id="biz-ind" value={biz.industry} onChange={(v) => setBiz({ ...biz, industry: v })} options={["LTL freight", "Truckload", "Freight brokerage", "Warehousing", "Last mile delivery"]} />
                  </Field>
                  <Field label="Time zone" id="biz-tz">
                    <Pick id="biz-tz" value={biz.tz} onChange={(v) => setBiz({ ...biz, tz: v })} options={["Central time (Chicago)", "Eastern time (New York)", "Mountain time (Denver)", "Pacific time (Los Angeles)"]} />
                  </Field>
                  <Field label="Business hours" id="biz-hours" hint="Outside these hours it takes messages instead of promising same-day answers.">
                    <Pick id="biz-hours" value={biz.hours} onChange={(v) => setBiz({ ...biz, hours: v })} options={["Weekdays, 7 AM to 6 PM", "Weekdays, 8 AM to 5 PM", "Every day, 24 hours"]} />
                  </Field>
                  <Field label="Sign emails as" id="biz-sign">
                    <Input id="biz-sign" value={biz.sign} onChange={(e) => setBiz({ ...biz, sign: e.target.value })} />
                  </Field>
                </div>
              </Panel>
            ) : null}

            {step === 1 ? (
              <Panel title="Invite your team" sub="They check the Operator's work and approve replies while it learns. You can invite more later.">
                <div className="flex flex-col gap-2">
                  {invites.map((inv, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        aria-label="Email"
                        placeholder="name@company.com"
                        value={inv.email}
                        disabled={sending}
                        onChange={(e) => setInvites(invites.map((x, k) => (k === i ? { ...x, email: e.target.value } : x)))}
                      />
                      <Pick
                        id={`role-${i}`}
                        className="w-40 flex-none"
                        value={inv.role}
                        onChange={(v) => setInvites(invites.map((x, k) => (k === i ? { ...x, role: v } : x)))}
                        options={["Admin", "Team member", "View only"]}
                      />
                      <span className="flex w-28 flex-none justify-end text-[13px]">
                        {inv.sent === "sending" ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Loader className="size-3.5 animate-spin" /> Sending
                          </span>
                        ) : inv.sent === "sent" ? (
                          <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400">
                            <Check className="size-3.5" /> Invite sent
                          </span>
                        ) : (
                          <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => setInvites(invites.filter((_, k) => k !== i))}>
                            <X />
                          </Button>
                        )}
                      </span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="self-start" disabled={sending} onClick={() => setInvites([...invites, { email: "", role: "Team member" }])}>
                    <Plus /> Add someone
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted/50 p-3.5 text-[13px] text-muted-foreground sm:grid-cols-3">
                  <span><b className="font-medium text-foreground">Admin:</b> everything, including setup and billing.</span>
                  <span><b className="font-medium text-foreground">Team member:</b> approves replies and teaches the Operator.</span>
                  <span><b className="font-medium text-foreground">View only:</b> sees Activity and reports.</span>
                </div>
              </Panel>
            ) : null}

            {step === 2 ? (
              <Panel
                title="Connect your team's email"
                sub="Connecting email creates a learning agent that reads your inboxes for the Operator. Pick what it reads from each one. Nothing is sent until your team says so."
              >
                <div className="flex flex-col gap-3">
                  {inboxes.map((ib, i) => {
                    const loading = ib.foldersShown < FOLDERS.length
                    return (
                      <Card key={ib.address} className={cn("gap-0 py-0 shadow-none", openInbox === i && "ring-1 ring-blue-600")}>
                        <button type="button" onClick={() => setOpenInbox(i)} className="flex items-center gap-3 px-4 py-3 text-left">
                          <span className="grid size-9 flex-none place-items-center rounded-lg bg-indigo-50 text-blue-800 dark:bg-indigo-950 dark:text-blue-200">
                            <Mail className="size-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="font-medium">{ib.address}</span>
                            <span className="text-[13px] text-muted-foreground">
                              {ib.provider} ·{" "}
                              {loading
                                ? "Finding folders"
                                : `${SCOPE_LABEL[ib.scope]}${ib.scope === "new" ? "" : ` · about ${threadsFor(ib).toLocaleString()} threads`}`}
                            </span>
                          </span>
                          {loading ? (
                            <Loader className="size-4 animate-spin text-muted-foreground" />
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[13px] text-green-700 dark:text-green-400">
                              <Check className="size-3.5" /> Connected
                            </span>
                          )}
                        </button>
                        {openInbox === i ? (
                          <div className="flex flex-col gap-2 border-t px-4 py-4 text-sm">
                            {loading ? (
                              <>
                                <span className="font-medium">Finding your folders</span>
                                <ul className="flex flex-col gap-1.5">
                                  {FOLDERS.slice(0, ib.foldersShown).map((f) => (
                                    <li key={f.name} className="flex items-center gap-2 text-[13px] animate-in fade-in slide-in-from-bottom-1">
                                      <Check className="size-3.5 text-green-600" />
                                      <span className="flex-1">{f.name}</span>
                                      <span className="text-muted-foreground tabular-nums">{f.count.toLocaleString()} threads</span>
                                    </li>
                                  ))}
                                  <li className="flex items-center gap-2 text-[13px] text-muted-foreground">
                                    <Loader className="size-3.5 animate-spin" /> Looking
                                  </li>
                                </ul>
                              </>
                            ) : (
                              <>
                                <span className="font-medium">What should it read?</span>
                                <ScopePicker
                                  idPrefix={`setup-${i}`}
                                  scope={ib.scope}
                                  setScope={(s: ReadScope) => patchInbox(i, { scope: s })}
                                  range={ib.range}
                                  setRange={(r) => patchInbox(i, { range: r })}
                                  folders={ib.folders}
                                  setFolders={(f) => patchInbox(i, { folders: f })}
                                />
                              </>
                            )}
                          </div>
                        ) : null}
                      </Card>
                    )
                  })}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(["Google Workspace", "Microsoft 365"] as const).map((p) => (
                      <Button key={p} variant="outline" className="h-12 justify-start gap-3" onClick={() => setSignIn(p)}>
                        <Mail />
                        {inboxes.length ? `Add another ${p} inbox` : `Connect ${p}`}
                      </Button>
                    ))}
                  </div>
                  {inboxes.length > 1 ? (
                    <span className="text-[13px] text-muted-foreground">
                      All {inboxes.length} inboxes will be answered by one agent, Email and texts. You can split a desk off into its own agent later.
                    </span>
                  ) : null}
                </div>
                <SignInDialog
                  key={signIn ?? "closed"}
                  provider={signIn}
                  taken={inboxes.map((i) => i.address)}
                  onClose={() => setSignIn(null)}
                  onConnected={(address) => {
                    addInbox(address, signIn!)
                    setSignIn(null)
                  }}
                />
              </Panel>
            ) : null}

            {step === 3 ? (
              <Panel title="Phone and systems" sub="Optional. Each phone line also gets its own learning agent.">
                <Toggle
                  icon={<Phone />}
                  title="Answer your customer service line"
                  sub="(555) 010-0345 · gives pickup and delivery status, and books call backs"
                  on={phone}
                  set={setPhone}
                  makes="Creates the Inbound phone line agent"
                />
                <Toggle icon={<Mail />} title="Text messages" sub="Reply to texts sent to the same number" on={texts} set={setTexts} />
                <Toggle
                  icon={<Plug />}
                  title="Connect your TMS"
                  sub="Lets it look up pickups, PROs and delivery dates in Acme. Without it, it can only learn, not answer."
                  on={tms !== "off"}
                  set={(v) => {
                    if (!v) return setTms("off")
                    setTms("connecting")
                    setTimeout(() => setTms((t) => (t === "connecting" ? "on" : t)), 1600)
                  }}
                  makes={tms === "connecting" ? "Connecting to Acme" : "Connected · 12,480 shipments found · added Acme lookups to every agent"}
                  busy={tms === "connecting"}
                />
              </Panel>
            ) : null}

            {step === 4 ? (
              <Panel title="Add documents" sub="Handbooks, rate sheets and dock hours. It lists every fact it learns so your team can check them. You can add more later in Teach.">
                <button
                  type="button"
                  onClick={() => {
                    const add = SAMPLE_DOCS.filter((d) => !docs.some((x) => x.name === d.name))
                    if (add.length) setDocs([...docs, ...add.map((d) => ({ ...d, progress: 0, state: "uploading" as const }))])
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed bg-background px-4 py-8 text-center hover:bg-muted/40"
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="font-medium">Drop files here or click to upload</span>
                  <span className="text-[13px] text-muted-foreground">PDF, Word, Excel or plain text</span>
                </button>
                {docs.length ? (
                  <ul className="flex flex-col divide-y rounded-lg border bg-background">
                    {docs.map((d) => (
                      <li key={d.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <FileText className="size-4 flex-none text-muted-foreground" />
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="truncate">{d.name}</span>
                          {d.state === "uploading" ? (
                            <span className="h-1 w-full max-w-60 overflow-hidden rounded-full bg-muted">
                              <span className="block h-full rounded-full bg-blue-600 transition-all" style={{ width: `${d.progress}%` }} />
                            </span>
                          ) : null}
                        </span>
                        <span className="w-36 flex-none text-right text-xs">
                          {d.state === "uploading" ? (
                            <span className="text-muted-foreground tabular-nums">
                              Uploading {d.progress}% · {d.size}
                            </span>
                          ) : d.state === "reading" ? (
                            <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                              <Loader className="size-3 animate-spin" /> Reading
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400">
                              <Check className="size-3" /> {d.facts} facts found
                            </span>
                          )}
                        </span>
                        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${d.name}`} onClick={() => setDocs(docs.filter((x) => x.name !== d.name))}>
                          <X />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Panel>
            ) : null}

            {step === 5 ? (
              <Panel title="Ready to build your Operator" sub="Here's what it will set up. Everything starts at Learn, so nothing is sent to a customer.">
                <ul className="flex flex-col divide-y rounded-lg border bg-background text-sm">
                  <Summary label="Business" value={`${biz.name} · ${biz.hours}`} onEdit={() => setStep(0)} />
                  <Summary label="Team" value={invites.filter((i) => i.email).length ? `${invites.filter((i) => i.email).length} teammates invited` : "Just you for now"} onEdit={() => setStep(1)} />
                  <Summary
                    label="Email"
                    value={inboxes.map((i) => `${i.address} (${SCOPE_LABEL[i.scope].toLowerCase()})`).join(", ") || "None yet"}
                    onEdit={() => setStep(2)}
                  />
                  <Summary label="Phone and systems" value={[phone && "Phone line", texts && "Texts", tms === "on" && "Acme TMS"].filter(Boolean).join(", ") || "None"} onEdit={() => setStep(3)} />
                  <Summary label="Documents" value={docs.length ? `${docs.length} files` : "None yet"} onEdit={() => setStep(4)} />
                </ul>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Creates icon={<Bot />} title={`${1 + (phone ? 1 : 0)} learning ${phone ? "agents" : "agent"}`} sub={["Email and texts", phone && "Inbound phone line"].filter(Boolean).join(" and ")} />
                  <Creates icon={<Workflow />} title={`${1 + (phone ? 1 : 0)} ${phone ? "workflows" : "workflow"}`} sub="How each agent handles what comes in. You can open and change them." />
                </div>
              </Panel>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={back} disabled={sending}>
                <ArrowLeft /> Back
              </Button>
              <div className="flex items-center gap-2">
                {(step === 1 || step === 3 || step === 4) && !sending ? (
                  <Button variant="ghost" onClick={next}>
                    Skip for now
                  </Button>
                ) : null}
                {step === 1 ? (
                  <Button onClick={sendInvites} disabled={sending}>
                    {sending ? <Loader className="animate-spin" /> : null}
                    {sending ? "Sending invites" : "Send invites and continue"}
                  </Button>
                ) : step === 5 ? (
                  <Button onClick={build}>
                    <Sparkles /> Build my Operator
                  </Button>
                ) : (
                  <Button
                    onClick={next}
                    disabled={(step === 2 && (inboxes.length === 0 || inboxes.some((i) => i.foldersShown < FOLDERS.length))) || (step === 4 && docsBusy) || (step === 3 && tms === "connecting")}
                  >
                    Continue <ArrowRight />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** A stand-in for the email provider's own sign-in and permission screens. Neutral on purpose: no provider branding. */
function SignInDialog({ provider, taken, onClose, onConnected }: { provider: Provider | null; taken: string[]; onClose: () => void; onConnected: (address: string) => void }) {
  const [stage, setStage] = useState<"account" | "consent" | "connecting">("account")
  const [account, setAccount] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const allow = () => {
    setStage("connecting")
    timer.current = setTimeout(() => onConnected(account), 1500)
  }

  return (
    <Dialog open={!!provider} onOpenChange={(o) => !o && stage !== "connecting" && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{provider} sign in</span>
          <DialogTitle>{stage === "account" ? "Choose an account" : stage === "consent" ? "Moneiva wants to access your account" : "Connecting"}</DialogTitle>
          <DialogDescription>
            {stage === "account" ? "to continue to Moneiva" : stage === "consent" ? account : `Linking ${account} to Moneiva`}
          </DialogDescription>
        </DialogHeader>
        {stage === "account" ? (
          <ul className="flex flex-col divide-y rounded-lg border">
            {ACCOUNTS.filter((a) => !taken.includes(a)).map((a) => (
              <li key={a}>
                <button
                  type="button"
                  onClick={() => {
                    setAccount(a)
                    setStage("consent")
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm hover:bg-muted/50"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-medium uppercase">{a[0]}</span>
                  <span className="flex flex-col">
                    <span className="font-medium">{a.split("@")[0][0].toUpperCase() + a.split("@")[0].slice(1)}</span>
                    <span className="text-xs text-muted-foreground">{a}</span>
                  </span>
                </button>
              </li>
            ))}
            <li className="px-3.5 py-3 text-sm text-muted-foreground">Use another account</li>
          </ul>
        ) : stage === "consent" ? (
          <div className="flex flex-col gap-4 text-sm">
            <ul className="flex flex-col gap-2.5">
              {[
                ["Read your email and folders", "To learn what your team does for each kind of request"],
                ["Send email as this inbox", "Only after a person on your team approves it"],
                ["See names in your contacts", "So replies use the right name"],
              ].map(([t, s]) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 flex-none text-green-600" />
                  <span className="flex flex-col">
                    <span>{t}</span>
                    <span className="text-xs text-muted-foreground">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> You can remove access at any time.
            </span>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={allow}>Allow</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader className="size-6 animate-spin text-blue-600" />
            Checking access and counting your email
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TopStrip() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <Image src="/moneiva-logo.png" alt="Moneiva" width={112} height={20} className="h-[18px] w-auto" priority />
      <Link href="/" className="text-[13px] text-muted-foreground hover:text-foreground">
        Finish later
      </Link>
    </header>
  )
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-indigo-50 text-blue-800 dark:bg-indigo-950 dark:text-blue-200">
        <Brain className="size-7" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to Moneiva</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Let&apos;s set up your Operator. It learns how your team works from your email and documents, then takes on more of the work as
          your team approves it. Setup takes about 10 minutes.
        </p>
      </div>
      <ol className="grid w-full grid-cols-2 gap-3 text-left sm:grid-cols-4">
        {[
          ["Learn", "Reads your past email and documents"],
          ["Shadow", "Watches live work and guesses"],
          ["Review", "Does the work, a person approves"],
          ["Autopilot", "Does it alone, all in Activity"],
        ].map(([t, s], i) => (
          <li key={t} className="flex flex-col gap-1 rounded-xl border bg-background p-3.5">
            <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
            <span className="font-medium">{t}</span>
            <span className="text-[13px] text-muted-foreground">{s}</span>
          </li>
        ))}
      </ol>
      <Button size="lg" onClick={onStart}>
        Get started <ArrowRight />
      </Button>
    </div>
  )
}

function Rail({ step, onGo }: { step: number; onGo: (i: number) => void }) {
  return (
    <nav aria-label="Setup steps" className="md:w-52 md:flex-none">
      <ol className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
        {STEPS.map((s, i) => {
          const done = i < step
          const on = i === step
          return (
            <li key={s.key} className="flex-none">
              <button
                type="button"
                onClick={() => onGo(i)}
                disabled={!done}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm",
                  on && "bg-background font-medium shadow-sm",
                  !on && !done && "text-muted-foreground",
                  done && "hover:bg-background/60"
                )}
              >
                <span
                  className={cn(
                    "grid size-6 flex-none place-items-center rounded-full border text-xs",
                    done && "border-green-600 bg-green-600 text-white",
                    on && "border-blue-600 text-blue-700 dark:text-blue-300"
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Panel({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <Card className="gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{sub}</p>
      </div>
      {children}
    </Card>
  )
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

function Pick({ id, value, onChange, options, className }: { id: string; value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Toggle({
  icon,
  title,
  sub,
  on,
  set,
  makes,
  busy,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  on: boolean
  set: (v: boolean) => void
  makes?: string
  busy?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background px-4 py-3.5">
      <span className="grid size-9 flex-none place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-4">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-[13px] text-muted-foreground">{sub}</span>
        {makes && on ? (
          <span className={cn("mt-1 inline-flex items-center gap-1.5 text-xs font-medium", busy ? "text-muted-foreground" : "text-blue-700 dark:text-blue-300")}>
            {busy ? <Loader className="size-3 animate-spin" /> : null}
            {makes}
          </span>
        ) : null}
      </span>
      <Switch checked={on} onCheckedChange={set} />
    </label>
  )
}

function Summary({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="w-36 flex-none text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{value}</span>
      <button type="button" onClick={onEdit} className="text-[13px] text-blue-600 hover:underline dark:text-blue-400">
        Edit
      </button>
    </li>
  )
}

function Creates({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-blue-50/60 px-4 py-3 dark:bg-blue-950/40">
      <span className="mt-0.5 text-blue-700 dark:text-blue-300 [&>svg]:size-4">{icon}</span>
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-[13px] text-muted-foreground">{sub}</span>
      </span>
    </div>
  )
}

// ---------------- Building: show every step, with the agent and workflow being made ----------------

const SUBJECTS = [
  "PRO 0300100456 delivery date?",
  "Re: Pickup 9800123 for today",
  "Need POD for invoice 44821",
  "Reschedule delivery appt, Fabrikam DC",
  "Rate question on our last shipment",
  "Out of office: Riley Chen",
  "Re: Missed pickup at Contoso",
  "Address correction for BOL 77812",
  "Hold at terminal please, PRO 0300100388",
  "Damaged pallet on delivery",
  "When will my freight arrive?",
  "Re: Re: dock hours change",
  "Weight inspection dispute",
  "Need a pickup tomorrow AM",
  "Freight charges on PRO 0300100123",
  "Can you confirm pickup for Friday?",
]

const FOUND = [
  ["ETA or status request", 212],
  ["New pickup request", 148],
  ["PRO tracking request", 131],
  ["Proof of delivery request", 96],
  ["Delivery appointment", 74],
  ["Confirmation on a pickup", 66],
  ["Billing or rate dispute", 41],
  ["Missed pickup recovery", 29],
  ["Address correction", 18],
  ["Auto-reply or out of office", 160],
] as const

type Task = { id: string; label: string; detail: string; ms: number }

function Building({ inboxes, phone, docs, tms, onDone }: { inboxes: SetupInbox[]; phone: boolean; docs: Doc[]; tms: boolean; onDone: () => void }) {
  const factTotal = docs.reduce((n, d) => n + d.facts, 0)
  const totalThreads = inboxes.reduce((n, i) => n + i.threads, 0)
  const tasks: Task[] = [
    ...inboxes.map((i) => ({
      id: `in:${i.address}`,
      label: i.threads ? `Importing ${i.address}` : `Watching ${i.address}`,
      detail: i.threads ? `${SCOPE_LABEL[i.scope]} · ${i.threads.toLocaleString()} threads` : "Only new email from now on",
      ms: i.threads ? 4200 : 1400,
    })),
    { id: "types", label: "Finding your kinds of request", detail: "Grouping what customers ask for", ms: 3600 },
    { id: "agent", label: "Creating the Email and texts agent", detail: "A learning agent that reads your inboxes for the Operator", ms: 1800 },
    { id: "flow", label: "Drawing its workflow", detail: "What happens when a new email comes in", ms: 3000 },
    ...(phone ? [{ id: "phone", label: "Creating the Inbound phone line agent", detail: "Answers (555) 010-0345, with its own workflow", ms: 1800 }] : []),
    ...(docs.length ? [{ id: "docs", label: `Learning from ${docs.length} documents`, detail: `${factTotal} facts to check`, ms: 2600 }] : []),
    ...(tms ? [{ id: "tms", label: "Linking Acme lookups", detail: "Pickups, PROs and delivery dates", ms: 1400 }] : []),
    { id: "compare", label: "Comparing with what your team did", detail: "Picking threads for your team to check first", ms: 2400 },
    { id: "learn", label: "Putting everything at Learn", detail: "Nothing is sent until your team says so", ms: 1200 },
  ]
  const total = tasks.reduce((n, t) => n + t.ms, 0)

  const [t, setT] = useState(0)
  useEffect(() => {
    if (t >= total) {
      const id = setTimeout(onDone, 1300)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setT((x) => Math.min(total, x + 100)), 100)
    return () => clearTimeout(id)
  }, [t, total, onDone])

  // Where are we: index of the running task and how far through it (0..1).
  let acc = 0
  let cur = tasks.length
  let p = 1
  for (let k = 0; k < tasks.length; k++) {
    if (t < acc + tasks[k].ms) {
      cur = k
      p = (t - acc) / tasks[k].ms
      break
    }
    acc += tasks[k].ms
  }
  const idx = (id: string) => tasks.findIndex((x) => x.id === id)
  const prog = (id: string) => {
    const k = idx(id)
    if (k < 0) return 0
    return k < cur ? 1 : k === cur ? p : 0
  }

  const read = inboxes.reduce((n, i) => n + Math.round(i.threads * prog(`in:${i.address}`)), 0)
  const importing = inboxes.find((i) => cur === idx(`in:${i.address}`) && i.threads)
  const feedStart = Math.floor(t / 180)
  const feed = importing ? [0, 1, 2, 3, 4].map((k) => SUBJECTS[(feedStart + k) % SUBJECTS.length]) : []
  const typesShown = Math.round(FOUND.length * prog("types"))
  const flow = FLOWS.op
  const flowShown = Math.round(flow.length * prog("flow"))
  const facts = Math.round(factTotal * prog("docs"))
  const toCheck = Math.round(38 * prog("compare"))

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <TopStrip />
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-8 md:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:py-12">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Building your Operator</h1>
            <p className="text-muted-foreground">You can watch, or leave and we&apos;ll email you when it&apos;s ready.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(t / total) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{Math.round((t / total) * 100)}% done</span>
          </div>
          <ol className="flex flex-col gap-1">
            {tasks.map((task, i) => {
              const state = i < cur ? "done" : i === cur ? "now" : "todo"
              return (
                <li key={task.id} className={cn("flex items-start gap-3 rounded-lg px-2.5 py-2", state === "now" && "bg-background shadow-sm")}>
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 flex-none place-items-center rounded-full border",
                      state === "done" && "border-green-600 bg-green-600 text-white",
                      state === "now" && "border-blue-600 text-blue-600"
                    )}
                  >
                    {state === "done" ? <Check className="size-3" /> : state === "now" ? <Loader className="size-3 animate-spin" /> : null}
                  </span>
                  <span className={cn("flex flex-col", state === "todo" && "text-muted-foreground")}>
                    <span className="text-sm font-medium">{task.label}</span>
                    <span className="text-xs text-muted-foreground">{task.detail}</span>
                  </span>
                </li>
              )
            })}
          </ol>
          <button type="button" onClick={() => setT(total)} className="self-start text-[13px] text-muted-foreground hover:text-foreground">
            Skip ahead
          </button>
        </div>

        {/* What's being made, as it's made. */}
        <Card className="gap-5 p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-blue-800 dark:bg-indigo-950 dark:text-blue-200">
              <Brain className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-semibold">The Operator</span>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {read.toLocaleString()} of {totalThreads.toLocaleString()} threads read · {typesShown} kinds of request · {facts} facts
              </span>
            </div>
          </div>

          {/* Live import feed */}
          <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Mail className="size-4 text-muted-foreground" />
              {importing ? `Reading ${importing.address}` : read ? "Email read" : "Waiting to read email"}
              {importing ? (
                <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
                  {Math.round(importing.threads * p).toLocaleString()} of {importing.threads.toLocaleString()}
                </span>
              ) : null}
            </span>
            {importing ? (
              <ul className="flex h-[110px] flex-col gap-1 overflow-hidden text-[13px]">
                {feed.map((s, k) => (
                  <li key={`${feedStart}-${k}`} className={cn("flex items-center gap-2 truncate", k > 2 && "opacity-50", k > 3 && "opacity-25")}>
                    <Check className="size-3 flex-none text-green-600" />
                    <span className="truncate">{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[13px] text-muted-foreground">
                {read ? `${read.toLocaleString()} threads from ${inboxes.length} ${inboxes.length === 1 ? "inbox" : "inboxes"}. Newsletters and spam skipped.` : "Starting"}
              </span>
            )}
          </div>

          <div className={cn("flex flex-col gap-2 transition-opacity duration-500", typesShown ? "opacity-100" : "opacity-40")}>
            <span className="text-sm font-medium">Kinds of request it found</span>
            <div className="flex flex-wrap gap-1.5">
              {FOUND.slice(0, typesShown).map(([n, c]) => (
                <span key={n} className="animate-in fade-in zoom-in-95 rounded-md border bg-background px-2 py-0.5 text-xs">
                  {n} <span className="text-muted-foreground tabular-nums">· {c}</span>
                </span>
              ))}
              {!typesShown ? <span className="text-xs text-muted-foreground">Starts after it reads your email</span> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MadeAgent state={cur > idx("agent") ? "ready" : cur === idx("agent") ? "making" : "next"} icon={<Mail />} name="Email and texts" sub={inboxes.map((i) => i.address).join(", ")} />
            {phone ? <MadeAgent state={cur > idx("phone") ? "ready" : cur === idx("phone") ? "making" : "next"} icon={<Phone />} name="Inbound phone line" sub="(555) 010-0345" /> : null}
          </div>

          <div className={cn("flex flex-col gap-2 transition-opacity duration-500", flowShown ? "opacity-100" : "opacity-40")}>
            <span className="flex items-center gap-2 text-sm font-medium">
              <Workflow className="size-4 text-muted-foreground" /> Workflow · Answer customer email
            </span>
            <ol className="flex flex-col items-start">
              {flow.map((s, i) => (
                <li key={s.title} className={cn("flex flex-col items-start transition-all duration-500", i < flowShown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0")}>
                  {i > 0 ? <span aria-hidden className="ml-4 h-3 w-px bg-border" /> : null}
                  <span className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-[13px]">
                    <span className="text-xs text-muted-foreground">{s.kind}</span>
                    <span className="font-medium">{s.title}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {docs.length || toCheck ? (
            <div className="grid grid-cols-2 gap-3">
              {docs.length ? <Stat n={facts} label={`facts from ${docs.length} documents`} /> : null}
              <Stat n={toCheck} label="threads for your team to check" />
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col rounded-xl border px-4 py-3">
      <span className="text-xl font-semibold tabular-nums">{n}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function MadeAgent({ state, icon, name, sub }: { state: "next" | "making" | "ready"; icon: React.ReactNode; name: string; sub: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-500",
        state === "next" && "border-dashed opacity-40",
        state === "ready" && "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30"
      )}
    >
      <span className="grid size-9 flex-none place-items-center rounded-lg bg-indigo-50 text-blue-800 dark:bg-indigo-950 dark:text-blue-200 [&>svg]:size-4">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{sub}</span>
        <span className="mt-1 text-xs">
          {state === "ready" ? (
            <span className="text-green-700 dark:text-green-400">Agent created · Learn</span>
          ) : state === "making" ? (
            <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <Loader className="size-3 animate-spin" /> Creating
            </span>
          ) : (
            <span className="text-muted-foreground">Next</span>
          )}
        </span>
      </span>
    </div>
  )
}

// ---------------- Done ----------------

function Done({ inboxes, phone, docs, invites, biz }: { inboxes: number; phone: boolean; docs: number; invites: number; biz: string }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <TopStrip />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-4 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
          <Check className="size-7" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{biz}&apos;s Operator is learning</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Everything starts at Learn, so nothing goes to a customer. The first threads for your team to check are waiting in Teach.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [inboxes, inboxes === 1 ? "inbox connected" : "inboxes connected"],
            [1 + (phone ? 1 : 0), phone ? "agents created" : "agent created"],
            [docs, docs === 1 ? "document read" : "documents read"],
            [invites, invites === 1 ? "teammate invited" : "teammates invited"],
          ].map(([n, l]) => (
            <Card key={String(l)} className="gap-0.5 px-4 py-3.5 shadow-none">
              <span className="text-2xl font-semibold tabular-nums">{n}</span>
              <span className="text-[13px] text-muted-foreground">{l}</span>
            </Card>
          ))}
        </div>

        <Card className="w-full gap-0 py-0 text-left">
          <div className="border-b px-5 py-3.5">
            <span className="font-medium">See what it made</span>
            <span className="block text-[13px] text-muted-foreground">Optional. You can always find these later under the Operator.</span>
          </div>
          <MadeLink href="/agents/op" icon={<Bot />} title="Email and texts agent" sub="Who it is, the inboxes it reads, and its tools" />
          <MadeLink href="/agents/op?tab=flow" icon={<Workflow />} title="Its workflow" sub="What happens step by step when a new email comes in" />
          {phone ? <MadeLink href="/agents/phone" icon={<Phone />} title="Inbound phone line agent" sub="Its greeting, voice and what it may do on a call" /> : null}
          <MadeLink href="/teach" icon={<Brain />} title="Threads to check in Teach" sub="Where the Operator would have done something different from your team" />
        </Card>

        <Button size="lg" asChild>
          <Link href="/">
            Go to Home <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function MadeLink({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0 hover:bg-muted/40">
      <span className="grid size-8 flex-none place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-4">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-[13px] text-muted-foreground">{sub}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  )
}
