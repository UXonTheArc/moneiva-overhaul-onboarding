"use client"

import { GripVertical, X } from "lucide-react"

import { ToneBadge } from "@/components/moneiva/status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BRANCH_LABELS, PALETTE, type CanvasLayout, type CanvasNode } from "@/lib/moneiva/automations-data"

import { CanvasSurface, DraftNote, StepCard, StepLink } from "./canvas"

type Choice = { label: string; kind: string }

export function AutomationCanvas({
  layout,
  nodes,
  editing,
  selected,
  onSelect,
  onAdd,
  onDelete,
}: {
  layout: CanvasLayout
  nodes: Record<string, CanvasNode>
  editing: boolean
  selected: string | null
  onSelect: (id: string | null) => void
  onAdd: (segment: keyof CanvasLayout, index: number, choice: Choice) => void
  onDelete: (id: string) => void
}) {
  const node = selected ? nodes[selected] : null

  const segment = (seg: keyof CanvasLayout) =>
    layout[seg].map((id, i) => {
      const n = nodes[id]
      return (
        <div key={id} className="flex flex-col items-center">
          {i > 0 ? <StepLink editing={editing} choices={PALETTE} onAdd={(c) => onAdd(seg, i, c)} /> : null}
          <StepCard
            n={n.n}
            kind={n.kind}
            title={n.title}
            sub={n.sub}
            isNew={n.n === "+"}
            selected={selected === id}
            onClick={() => onSelect(selected === id ? null : id)}
            className="w-[260px]"
          />
        </div>
      )
    })

  return (
    <div className="flex flex-col gap-4">
      {editing ? (
        <DraftNote>
          You are editing a draft of the canvas. The live version keeps running until you publish. Click a step to change it, or add one
          from the left. Agent steps use the agent&apos;s own setup.
        </DraftNote>
      ) : null}
      <div className="flex flex-col items-stretch gap-4 lg:flex-row">
        {editing ? (
          <Card className="gap-1.5 p-3 lg:w-[200px] lg:flex-none">
            <span className="px-1 pb-1 text-xs font-medium text-muted-foreground">Add a step</span>
            {PALETTE.map((p) => (
              <div
                key={p.label}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-step", JSON.stringify({ label: p.label, kind: p.kind }))
                  e.dataTransfer.effectAllowed = "copy"
                }}
                className="flex cursor-grab items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-card px-2.5 py-2 text-[13px] active:cursor-grabbing dark:border-zinc-700"
              >
                <i className="size-2 rounded-xs" style={{ background: p.color }} />
                <span className="flex-1">{p.label}</span>
                <GripVertical className="size-3.5 text-muted-foreground" />
              </div>
            ))}
            <span className="p-1 text-xs text-muted-foreground">Drag a step onto a + between steps.</span>
          </Card>
        ) : null}

        <CanvasSurface className="flex-1">
          {segment("main")}
          <div className="relative flex items-start gap-10 pt-[18px]">
            <div className="absolute top-0 right-1/4 left-1/4 h-[18px] rounded-t-lg border-2 border-b-0 border-zinc-300 dark:border-zinc-700" />
            <div className="flex flex-col items-center">
              <ToneBadge tone="red" className="mb-2">
                {BRANCH_LABELS.problem}
              </ToneBadge>
              {segment("problem")}
            </div>
            <div className="flex flex-col items-center">
              <ToneBadge tone="green" className="mb-2">
                {BRANCH_LABELS.fine}
              </ToneBadge>
              {segment("fine")}
            </div>
          </div>
          <StepLink editing={editing} choices={PALETTE} onAdd={(c) => onAdd("tail", 0, c)} />
          {segment("tail")}
        </CanvasSurface>

        {node ? (
          <Card className="gap-3.5 self-start p-[18px] lg:w-[300px] lg:flex-none">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {node.n === "+" ? "New step" : `Step ${node.n}`} · {node.kind}
                </span>
                <span className="text-base font-semibold">{node.title}</span>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Close step" onClick={() => onSelect(null)}>
                <X />
              </Button>
            </div>
            {node.fields.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                {editing ? (
                  <>
                    <Label htmlFor={`f-${node.id}-${label}`} className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <Input id={`f-${node.id}-${label}`} defaultValue={value} />
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm">{value}</span>
                  </>
                )}
              </div>
            ))}
            {editing ? (
              <Button variant="ghost" size="sm" className="self-start text-destructive hover:text-destructive" onClick={() => onDelete(node.id)}>
                Delete step
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Click Edit canvas to change this step.</span>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  )
}
