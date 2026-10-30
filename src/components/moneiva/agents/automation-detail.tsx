"use client"

import { Ellipsis, Pencil } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/moneiva/page-header"
import { STATUS } from "@/components/moneiva/status"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AUTOMATION_STATUS_OPTIONS,
  CANVAS,
  DAMAGE_REPORT,
  NODES,
  RUN_PERIODS,
  RUN_RESULT_FILTERS,
  type CanvasLayout,
  type CanvasNode,
} from "@/lib/moneiva/automations-data"
import type { AgentStatus } from "@/lib/moneiva/data"

import { AutomationCanvas } from "./automation-canvas"
import { AutomationRuns } from "./automation-runs"
import { AutomationSettings } from "./automation-settings"
import { SimpleSelect } from "./form-row"
import { MenuItem, StatusMenu } from "./menus"
import { useQuery } from "./use-query"

const TABS = ["canvas", "runs", "settings"] as const
type Tab = (typeof TABS)[number]

export function AutomationDetail() {
  const q = useQuery()
  const rawTab = q.get("tab") as Tab | null
  const tab: Tab = rawTab && TABS.includes(rawTab) ? rawTab : "canvas"
  const editing = tab === "canvas" && q.get("edit") === "1"
  const selected = q.get("node")
  const openRuns = (q.get("open") ?? "").split(",").filter(Boolean)

  const [status, setStatus] = useState<AgentStatus>("live")
  const [published, setPublished] = useState<CanvasLayout>(CANVAS)
  const [draft, setDraft] = useState<CanvasLayout | null>(null)
  const [nodes, setNodes] = useState<Record<string, CanvasNode>>(NODES)
  const [publishedNote, setPublishedNote] = useState(DAMAGE_REPORT.published)
  const [result, setResult] = useState(RUN_RESULT_FILTERS[0])

  const layout = editing ? (draft ?? published) : published
  const canvasNote = editing ? "Draft, not live yet" : draft ? "Draft saved, not live yet" : publishedNote

  const startEdit = () => {
    if (!draft) setDraft(published)
    q.set({ tab: null, edit: "1", node: selected ?? "wait" })
  }
  const addStep = (segment: keyof CanvasLayout, index: number, choice: { label: string; kind: string }) => {
    const id = `new${Date.now()}`
    setNodes((n) => ({
      ...n,
      [id]: {
        id,
        n: "+",
        kind: choice.kind,
        title: choice.label,
        sub: "New step. Set it up before you publish.",
        fields: [["What it does", choice.label], ["Details", "Pick what this step uses and where it sends"]],
      },
    }))
    setDraft((d) => {
      const base = d ?? published
      const seg = base[segment]
      return { ...base, [segment]: [...seg.slice(0, index), id, ...seg.slice(index)] }
    })
    q.set({ node: id })
  }
  const deleteStep = (id: string) => {
    setDraft((d) => {
      const base = d ?? published
      return {
        main: base.main.filter((x) => x !== id),
        problem: base.problem.filter((x) => x !== id),
        fine: base.fine.filter((x) => x !== id),
        tail: base.tail.filter((x) => x !== id),
      }
    })
    q.set({ node: null })
    toast("Step removed from the draft.")
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Workflows", href: "/workflows" }, { label: DAMAGE_REPORT.name }]}
        title={DAMAGE_REPORT.name}
        description={DAMAGE_REPORT.description}
        actions={
          <>
            <StatusMenu
              value={status}
              options={AUTOMATION_STATUS_OPTIONS}
              onChange={(s) => {
                if (s !== status) toast.success(`${DAMAGE_REPORT.name} is now ${STATUS[s].label}.`)
                setStatus(s)
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions" className="data-[state=open]:bg-accent">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[230px]">
                <MenuItem label="Run a test" sub="Pick a past report and see what would happen" />
                <MenuItem label="Version history" sub={publishedNote} />
                <MenuItem label="Duplicate" />
                <MenuItem label="Rename" />
                <MenuItem label="Export" />
                <DropdownMenuSeparator />
                <MenuItem
                  label="Archive"
                  sub="Turns it off and moves it to Archived"
                  danger
                  onSelect={() => {
                    const was = status
                    setStatus("archived")
                    toast(`${DAMAGE_REPORT.name} archived.`, { action: { label: "Undo", onClick: () => setStatus(was) } })
                  }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <span>{DAMAGE_REPORT.error}</span>
        <Button variant="outline" size="sm" asChild className="text-foreground">
          <Link href="/agents/osd">Fix the agent</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(t) => q.set({ tab: t === "canvas" ? null : t, edit: null })} className="gap-5 [contain:inline-size]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          {tab === "runs" ? (
            <div className="flex flex-wrap gap-2">
              <SimpleSelect label="Result" value={result} onChange={setResult} options={RUN_RESULT_FILTERS} size="sm" className="w-auto" />
              <SimpleSelect label="Period" defaultValue={RUN_PERIODS[0]} options={RUN_PERIODS} size="sm" className="w-auto" />
            </div>
          ) : null}
          {tab === "canvas" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[13px] text-muted-foreground">{canvasNote}</span>
              {editing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setDraft(null)
                      q.set({ edit: null, node: selected && NODES[selected] ? selected : null })
                      toast("Draft discarded. The live version is unchanged.")
                    }}
                  >
                    Discard draft
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      q.set({ edit: null })
                      toast.success("Draft saved. The live version keeps running until you publish.")
                    }}
                  >
                    Save draft
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (draft) setPublished(draft)
                      setDraft(null)
                      setPublishedNote("Published just now by Taylor Morgan")
                      q.set({ edit: null })
                      toast.success("Published. New runs use this version.")
                    }}
                  >
                    Publish
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={startEdit}>
                  <Pencil /> Edit canvas
                </Button>
              )}
            </div>
          ) : null}
          {tab === "settings" ? (
            <span className="text-[13px] text-muted-foreground">Changes here apply as soon as you save, even while it is live.</span>
          ) : null}
        </div>

        <TabsContent value="canvas">
          <AutomationCanvas
            layout={layout}
            nodes={nodes}
            editing={editing}
            selected={selected && nodes[selected] ? selected : null}
            onSelect={(id) => q.set({ node: id })}
            onAdd={addStep}
            onDelete={deleteStep}
          />
        </TabsContent>
        <TabsContent value="runs">
          <AutomationRuns
            result={result}
            open={openRuns}
            onToggle={(id) => {
              const next = openRuns.includes(id) ? openRuns.filter((x) => x !== id) : [...openRuns, id]
              q.set({ open: next.join(",") || null })
            }}
          />
        </TabsContent>
        <TabsContent value="settings">
          <AutomationSettings
            onArchive={() => {
              const was = status
              setStatus("archived")
              toast(`${DAMAGE_REPORT.name} archived.`, { action: { label: "Undo", onClick: () => setStatus(was) } })
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
