"use client"

import { useState } from "react"
import { toast } from "sonner"

import { StageBadge } from "@/components/moneiva/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Agent } from "@/lib/moneiva/agents-data"
import { TEST_EMAIL } from "@/lib/moneiva/agents-extra-data"

import { SimpleSelect } from "./form-row"

/** Test agent: email agents run on a past email and show what they would do; voice agents place a practice call. */
export function AgentTestSheet({ agent, open, onOpenChange }: { agent: Agent; open: boolean; onOpenChange: (o: boolean) => void }) {
  const voice = agent.kind === "inbound" || agent.kind === "outbound"
  const [ran, setRan] = useState(true)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-[560px]">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-lg font-medium">Test {agent.name}</SheetTitle>
          <SheetDescription>
            {voice ? "Place a practice call with the live setup." : "Run it on a past or made up email. Nothing is sent."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-auto px-6 py-5">
          {voice ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="test-phone">Call me at</Label>
                <Input id="test-phone" placeholder="Your phone number" inputMode="tel" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="test-pretend">Pretend to be</Label>
                <SimpleSelect id="test-pretend" defaultValue={TEST_EMAIL.pretend[0]} options={TEST_EMAIL.pretend} />
              </div>
              <Button className="self-start" onClick={() => toast.success(`Calling you now. ${agent.callName ?? "The agent"} will pick up the conversation.`)}>
                Start test call
              </Button>
              <p className="text-[13px] text-muted-foreground">
                The call uses the live voice and Playbook. It isn&apos;t logged in Activity, and no calls back or texts go out.
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="test-from">Start from</Label>
                <SimpleSelect id="test-from" defaultValue={TEST_EMAIL.startFrom[0]} options={TEST_EMAIL.startFrom} onChange={() => setRan(false)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <div className="rounded-lg border px-3 py-2.5 text-sm leading-relaxed whitespace-pre-line">{TEST_EMAIL.email}</div>
              </div>
              <Button className="self-start" onClick={() => setRan(true)}>
                Run test
              </Button>
              {ran ? (
                <div className="flex flex-col gap-2.5 rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3.5 dark:border-blue-900 dark:bg-blue-950">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">What it would do</span>
                  <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-2 text-sm">
                    {TEST_EMAIL.result.map(([k, v], i) => (
                      <div key={k} className="contents">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="flex flex-wrap items-center gap-1.5">
                          {v}
                          {i === 0 ? <StageBadge stage="Review" /> : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="rounded-lg border bg-card px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line">{TEST_EMAIL.reply}</div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
