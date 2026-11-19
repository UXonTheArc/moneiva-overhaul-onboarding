"use client"

import Link from "next/link"
import { Activity, Bot, Inbox, Mail, Phone, Plus, Workflow } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/moneiva/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useHydrated, useSetup } from "@/lib/moneiva/setup-store"

import { Empty, SetupButton } from "./gate"

export function CleanInbox() {
  const hydrated = useHydrated()
  const s = useSetup()
  if (!hydrated) return null
  return (
    <>
      <PageHeader title="Inbox" description="Replies to approve, calls to return and new kinds of request to name." />
      <Empty
        icon={<Inbox />}
        title="Nothing needs you yet"
        sub={
          s
            ? "While every kind of request is at Learn, the Operator only reads. Replies to approve show up here once one reaches Review."
            : "Once your email is connected, anything that needs a person shows up here."
        }
        action={
          s ? (
            <Button asChild variant="outline">
              <Link href="/teach">Check what it learned</Link>
            </Button>
          ) : (
            <SetupButton />
          )
        }
      />
    </>
  )
}

export function CleanActivity() {
  const hydrated = useHydrated()
  const s = useSetup()
  if (!hydrated) return null
  return (
    <>
      <PageHeader title="Activity" description="Every email and call the Operator handled, and what happened." />
      <Empty
        icon={<Activity />}
        title="Nothing has happened yet"
        sub={
          s
            ? "At Learn it reads past email but doesn't act on anything. Once a kind of request reaches Shadow, every guess it makes shows up here."
            : "Every email, call and workflow run will show up here once you're set up."
        }
        action={s ? null : <SetupButton />}
      />
    </>
  )
}

export function CleanTaskAgents() {
  const hydrated = useHydrated()
  if (!hydrated) return null
  return (
    <>
      <PageHeader
        title="Task agents"
        description="Task agents follow a script you set, like calling carriers about late loads. Workflows decide when they run."
        actions={
          <Button onClick={() => toast("Creating task agents isn't part of this onboarding demo.")}>
            <Plus /> Create agent
          </Button>
        }
      />
      <Empty
        icon={<Bot />}
        title="No task agents yet"
        sub="You don't need one to start. Add one when there's a job you want done the same way every time, like check calls or catalog updates."
      />
    </>
  )
}

export function CleanWorkflows() {
  const hydrated = useHydrated()
  const s = useSetup()
  if (!hydrated) return null
  const flows = s
    ? [
        { name: "Answer customer email", sub: `Runs on new email to ${s.inboxes.map((i) => i.address).join(", ")}`, agent: "Email and texts", icon: <Mail />, href: "/agents/op?tab=flow" },
        ...(s.phone ? [{ name: "Answer the customer service line", sub: "Runs on each call to (555) 010-0345", agent: "Inbound phone line", icon: <Phone />, href: "/agents/phone?tab=flow" }] : []),
      ]
    : []
  return (
    <>
      <PageHeader title="Workflows" description="When work starts, what happens next, and which agents do it." />
      {flows.length ? (
        <Card className="gap-0 divide-y py-0">
          {flows.map((f) => (
            <Link key={f.name} href={f.href} className="flex items-center gap-3 px-5 py-4 hover:bg-muted/40">
              <span className="grid size-9 flex-none place-items-center rounded-lg bg-indigo-50 text-blue-800 dark:bg-indigo-950 dark:text-blue-200 [&>svg]:size-4">{f.icon}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{f.name}</span>
                <span className="truncate text-[13px] text-muted-foreground">{f.sub}</span>
              </span>
              <span className="hidden text-[13px] text-muted-foreground sm:block">Made by setup · {f.agent}</span>
              <span className="inline-flex items-center gap-1.5 text-[13px]">
                <i className="size-2 rounded-full bg-green-600" /> Learning
              </span>
            </Link>
          ))}
        </Card>
      ) : (
        <Empty icon={<Workflow />} title="No workflows yet" sub="Setup creates one for each inbox and phone line you connect." action={<SetupButton />} />
      )}
    </>
  )
}
