"use client"

import { Pencil, TriangleAlert, X } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/moneiva/page-header"
import { STATUS } from "@/components/moneiva/status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AUTOMATION_STATUS_OPTIONS } from "@/lib/moneiva/automations-data"
import type { AgentStatus } from "@/lib/moneiva/data"
import {
  FLOW_KIND_COLOR,
  PHONE_CHECK,
  PHONE_CHECK_INFO,
  ZOOM_CONNECTIONS,
  allSplits,
  flattenSteps,
  type FlowItem,
} from "@/lib/moneiva/phone-check-data"

import { FlowTree } from "./flow-tree"
import { SimpleSelect } from "./form-row"
import { StatusMenu } from "./menus"
import { useQuery } from "./use-query"

const STATUS_OPTIONS = AUTOMATION_STATUS_OPTIONS.map((o) => (o.value === "live" ? { ...o, sub: "Runs on every new OS&D file." } : o))

/** How many different places a row can finish. */
function endings(path: FlowItem[], joins = false): number {
  let n = 0
  path.forEach((it, i) => {
    if ("split" in it) it.split.branches.forEach((b) => (n += endings(b.path, !!it.split.join)))
    else if (i === path.length - 1 && (!joins || it.step.end)) n++
  })
  return n
}

/** Once a Zoom connection is picked, the text steps lose their warning and show the connection. */
function withZoom(items: FlowItem[], zoom: string | null): FlowItem[] {
  if (!zoom) return items
  return items.map((it) =>
    "step" in it
      ? it.step.setup
        ? { step: { ...it.step, setup: undefined, fields: it.step.fields.map(([k, v]) => [k, k === "Zoom connection" ? zoom : v] as [string, string]) } }
        : it
      : { split: { ...it.split, branches: it.split.branches.map((b) => ({ ...b, path: withZoom(b.path, zoom) })) } }
  )
}

export function PhoneCheckDetail() {
  const q = useQuery()
  const [status, setStatus] = useState<AgentStatus>("live")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const [zoom, setZoom] = useState<string | null>(null)
  const items = useMemo(() => withZoom(PHONE_CHECK, zoom), [zoom])
  const steps = useMemo(() => flattenSteps(items), [items])
  const numbers = useMemo(() => Object.fromEntries(steps.map((s, i) => [s.id, i + 1])), [steps])
  const needSetup = steps.filter((s) => s.setup)
  const paths = useMemo(() => endings(PHONE_CHECK), [])

  const selectedId = q.get("node")
  const node = steps.find((s) => s.id === selectedId) ?? null
  const select = (id: string | null) => q.set({ node: id })

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Workflows", href: "/workflows" }, { label: PHONE_CHECK_INFO.name }]}
        title={PHONE_CHECK_INFO.name}
        description={PHONE_CHECK_INFO.description}
        actions={
          <>
            <StatusMenu
              value={status}
              options={STATUS_OPTIONS}
              onChange={(v) => {
                if (v !== status) toast.success(`${PHONE_CHECK_INFO.name} is now ${STATUS[v].label}.`)
                setStatus(v)
              }}
            />
            <Button onClick={() => toast("Editing this canvas works like Damage report follow-up. This mockup shows the layout only.")}>
              <Pencil /> Edit canvas
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted-foreground">
        <span>
          <b className="font-medium text-foreground">{steps.length}</b> steps
        </span>
        <span>
          <b className="font-medium text-foreground">{paths}</b> ways it can end
        </span>
        <span>Uses OS&amp;D check calls</span>
        <span>{PHONE_CHECK_INFO.lastRun}</span>
        <span>{PHONE_CHECK_INFO.published}</span>
      </div>

      {needSetup.length ? (
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-3 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100">
          <span className="inline-flex items-center gap-2">
            <TriangleAlert className="size-4" />
            {needSetup.length} text steps can&apos;t send because their Zoom connection was removed. Those rows stop at the text step.
          </span>
          <Button variant="outline" size="sm" className="text-foreground" onClick={() => select(needSetup[0].id)}>
            Show me
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col items-stretch gap-4 xl:flex-row">
        <div className="min-w-0 flex-1">
          <FlowTree
            items={items}
            numbers={numbers}
            selected={node?.id ?? null}
            onSelect={select}
            collapsed={collapsed}
            onToggle={(id) =>
              setCollapsed((c) => {
                const n = new Set(c)
                if (n.has(id)) n.delete(id)
                else n.add(id)
                return n
              })
            }
            onCollapseAll={() => setCollapsed(new Set(allSplits(PHONE_CHECK).filter((id) => ["phones", "tries", "tries-driver", "tries-disp"].includes(id))))}
            onExpandAll={() => setCollapsed(new Set())}
          />
          <p className="mt-2 text-xs text-muted-foreground">Click a step to see what it does. Collapse a group of paths with the small button above it.</p>
        </div>

        {node ? (
          <Card className="gap-3.5 self-start p-[18px] xl:sticky xl:top-20 xl:w-[300px] xl:flex-none">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <i className="size-2 rounded-xs" style={{ background: FLOW_KIND_COLOR[node.kind] }} />
                  Step {numbers[node.id]} · {node.kind}
                </span>
                <span className="text-base font-semibold">{node.title}</span>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Close step" onClick={() => select(null)}>
                <X />
              </Button>
            </div>
            {node.setup ? (
              <div className="flex flex-col gap-2.5 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 text-[13px] text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100">
                <span className="font-medium">{node.setup}</span>
                <span>Pick a Zoom connection and both text steps start sending again.</span>
                <SimpleSelect
                  label="Zoom connection"
                  value=""
                  placeholder="Choose a Zoom connection"
                  options={ZOOM_CONNECTIONS}
                  className="bg-background text-foreground"
                  onChange={(v) => {
                    setZoom(v)
                    toast.success("Zoom connection set. Both text steps can send again.", { action: { label: "Undo", onClick: () => setZoom(null) } })
                  }}
                />
              </div>
            ) : null}
            {node.fields.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <span className="text-sm">{value}</span>
              </div>
            ))}
            <span className="text-xs text-muted-foreground">Click Edit canvas to change this step.</span>
          </Card>
        ) : null}
      </div>
    </>
  )
}
