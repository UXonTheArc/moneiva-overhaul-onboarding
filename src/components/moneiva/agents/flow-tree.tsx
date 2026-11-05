"use client"

import { ChevronsDownUp, ChevronsUpDown, Maximize2, Minus, Plus, TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FLOW_KIND_COLOR, type FlowBranch, type FlowItem, type FlowSplit, type FlowStep } from "@/lib/moneiva/phone-check-data"

type Edge = { from: string; to: string; join?: boolean }

/** The ids a path hands on to whatever comes after it. Ended paths hand on nothing. */
function tails(path: FlowItem[], collapsed: Set<string>): string[] {
  const last = path[path.length - 1]
  if (!last) return []
  if ("step" in last) return last.step.end ? [] : [last.step.id]
  if (!last.split.join) return []
  if (collapsed.has(last.split.id)) return [`more:${last.split.id}`]
  return last.split.branches.flatMap((b) => tails(b.path, collapsed))
}

function edgesFor(path: FlowItem[], collapsed: Set<string>, into: string[] = [], out: Edge[] = []): Edge[] {
  let prev = into
  path.forEach((it) => {
    if ("step" in it) {
      prev.forEach((p) => out.push({ from: p, to: it.step.id, join: prev.length > 1 }))
      prev = it.step.end ? [] : [it.step.id]
      return
    }
    const sp = it.split
    if (collapsed.has(sp.id)) {
      prev.forEach((p) => out.push({ from: p, to: `more:${sp.id}` }))
      prev = sp.join ? [`more:${sp.id}`] : []
      return
    }
    sp.branches.forEach((b, i) => {
      const chip = `${sp.id}:${i}`
      prev.forEach((p) => out.push({ from: p, to: chip }))
      edgesFor(b.path, collapsed, [chip], out)
    })
    prev = sp.join ? sp.branches.flatMap((b) => tails(b.path, collapsed)) : []
  })
  return out
}

function countSteps(branches: FlowBranch[]): number {
  let n = 0
  const walk = (items: FlowItem[]) => items.forEach((it) => ("step" in it ? n++ : it.split.branches.forEach((b) => walk(b.path))))
  branches.forEach((b) => walk(b.path))
  return n
}

export function FlowTree({
  items,
  numbers,
  selected,
  onSelect,
  collapsed,
  onToggle,
  onCollapseAll,
  onExpandAll,
}: {
  items: FlowItem[]
  numbers: Record<string, number>
  selected: string | null
  onSelect: (id: string | null) => void
  collapsed: Set<string>
  onToggle: (id: string) => void
  onCollapseAll: () => void
  onExpandAll: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState({ x: 0, y: 20, s: 1 })
  const [fitted, setFitted] = useState(true)
  const [lines, setLines] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ id: number; x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null)

  /** Fit the tree's width in the box, centered, top aligned. */
  const fitView = useCallback(() => {
    const b = box.current
    const el = inner.current
    if (!b || !el) return null
    const s = Math.min(1, Math.max(0.3, (b.clientWidth - 40) / el.offsetWidth))
    return { x: (b.clientWidth - el.offsetWidth * s) / 2, y: 20, s }
  }, [])

  // Measure the tree and draw the connecting lines from where the cards actually landed.
  const measure = useCallback(() => {
    const el = inner.current
    if (!el) return
    setSize({ w: el.offsetWidth, h: el.offsetHeight })
    const base = el.getBoundingClientRect()
    const k = base.width / el.offsetWidth || 1
    const pos = (id: string) => {
      const n = el.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`)
      if (!n) return null
      const r = n.getBoundingClientRect()
      return { x: (r.left + r.width / 2 - base.left) / k, top: (r.top - base.top) / k, bottom: (r.bottom - base.top) / k }
    }
    const next: string[] = []
    for (const e of edgesFor(items, collapsed)) {
      const a = pos(e.from)
      const b = pos(e.to)
      if (!a || !b) continue
      const mid = e.join ? b.top - 20 : a.bottom + Math.min(20, (b.top - a.bottom) / 2)
      next.push(
        Math.abs(a.x - b.x) < 1
          ? `M${a.x},${a.bottom} V${b.top}`
          : `M${a.x},${a.bottom} V${mid - 6} Q${a.x},${mid} ${a.x + Math.sign(b.x - a.x) * 6},${mid} H${b.x - Math.sign(b.x - a.x) * 6} Q${b.x},${mid} ${b.x},${mid + 6} V${b.top}`
      )
    }
    setLines(next)
  }, [items, collapsed])

  // ResizeObserver also fires once on observe, which draws the first lines and fits the view.
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      measure()
      if (fitted) {
        const v = fitView()
        if (v) setView(v)
      }
    })
    if (box.current) ro.observe(box.current)
    if (inner.current) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [measure, fitted, fitView])

  /** Zoom by a factor, keeping the point under (cx, cy) in place. */
  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setFitted(false)
    setView((v) => {
      const s = Math.min(1.6, Math.max(0.3, v.s * factor))
      return { s, x: cx - ((cx - v.x) * s) / v.s, y: cy - ((cy - v.y) * s) / v.s }
    })
  }, [])
  const zoom = (factor: number) => {
    const b = box.current
    if (b) zoomAt(factor, b.clientWidth / 2, b.clientHeight / 2)
  }

  // Mouse wheel and trackpad pinch zoom around the pointer. Shift + wheel, or a sideways swipe, pans.
  // Needs a non-passive listener so the page doesn't scroll too.
  useEffect(() => {
    const b = box.current
    if (!b) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = b.getBoundingClientRect()
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      if (e.shiftKey || (sideways && !e.ctrlKey && !e.metaKey)) {
        setFitted(false)
        setView((v) => (e.shiftKey ? { ...v, x: v.x - (e.deltaX || e.deltaY) } : { ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
        return
      }
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      zoomAt(Math.exp(-Math.max(-60, Math.min(60, dy)) * 0.004), e.clientX - r.left, e.clientY - r.top)
    }
    b.addEventListener("wheel", onWheel, { passive: false })
    return () => b.removeEventListener("wheel", onWheel)
  }, [zoomAt])

  // Drag anywhere to move the canvas. A press that doesn't move still clicks the step under it.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
      setFitted(false)
      box.current?.setPointerCapture(e.pointerId)
    }
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }))
  }
  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return
    if (box.current?.hasPointerCapture(e.pointerId)) box.current.releasePointerCapture(e.pointerId)
    setDragging(false)
    // Leave the moved flag for the click that follows, so it is swallowed.
    setTimeout(() => (drag.current = null), 0)
  }

  return (
    <div className="relative min-w-0 rounded-xl border bg-zinc-50 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {(["Starts when", "Question", "Remember", "Agent", "Send a text", "Finish"] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <i className="size-2 rounded-xs" style={{ background: FLOW_KIND_COLOR[k] }} />
              {k}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={collapsed.size ? onExpandAll : onCollapseAll}>
            {collapsed.size ? <ChevronsUpDown /> : <ChevronsDownUp />}
            {collapsed.size ? "Expand all" : "Collapse all"}
          </Button>
          <span className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}>
            <Minus />
          </Button>
          <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">{Math.round(view.s * 100)}%</span>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => zoom(1.2)}>
            <Plus />
          </Button>
          <Button
            variant={fitted ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setFitted(true)
              const v = fitView()
              if (v) setView(v)
            }}
          >
            <Maximize2 /> Fit
          </Button>
        </div>
      </div>
      <div
        ref={box}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.stopPropagation()
            e.preventDefault()
          }
        }}
        className={cn(
          "relative h-[70vh] min-h-[420px] touch-none overflow-hidden rounded-b-xl bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] select-none dark:bg-[radial-gradient(#3f3f46_1px,transparent_1px)]",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ backgroundSize: `${16 * view.s}px ${16 * view.s}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
      >
        <div ref={inner} className="absolute top-0 left-0 w-max origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
          <svg className="pointer-events-none absolute inset-0 overflow-visible" width={size.w} height={size.h} aria-hidden>
            {lines.map((d, i) => (
              <path key={i} d={d} fill="none" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth={1.5} />
            ))}
          </svg>
          <Path items={items} numbers={numbers} selected={selected} onSelect={onSelect} collapsed={collapsed} onToggle={onToggle} />
        </div>
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
          Drag to move. Scroll or pinch to zoom.
        </span>
      </div>
    </div>
  )
}

type PathProps = {
  items: FlowItem[]
  numbers: Record<string, number>
  selected: string | null
  onSelect: (id: string | null) => void
  collapsed: Set<string>
  onToggle: (id: string) => void
}

function Path({ items, ...rest }: PathProps) {
  return (
    <div className="flex flex-col items-center gap-10">
      {items.map((it) =>
        "step" in it ? (
          <Node key={it.step.id} step={it.step} n={rest.numbers[it.step.id]} selected={rest.selected === it.step.id} onSelect={rest.onSelect} />
        ) : (
          <Split key={it.split.id} split={it.split} {...rest} />
        )
      )}
    </div>
  )
}

const CHIP = {
  yes: "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  no: "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  case: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
}

function Split({ split, ...rest }: { split: FlowSplit } & Omit<PathProps, "items">) {
  if (rest.collapsed.has(split.id)) {
    return (
      <button
        type="button"
        data-node={`more:${split.id}`}
        onClick={() => rest.onToggle(split.id)}
        className="rounded-full border border-dashed border-zinc-400 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
      >
        {split.branches.length} paths, {countSteps(split.branches)} steps hidden. Show
      </button>
    )
  }
  return (
    <div className="relative flex items-start gap-6">
      <button
        type="button"
        onClick={() => rest.onToggle(split.id)}
        aria-label="Collapse these paths"
        title="Collapse these paths"
        className="absolute -top-[30px] left-1/2 z-10 ml-3 grid size-5 place-items-center rounded-full border bg-card text-muted-foreground opacity-60 hover:opacity-100"
      >
        <ChevronsDownUp className="size-3" />
      </button>
      {split.branches.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-3">
          <span data-node={`${split.id}:${i}`} className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", CHIP[b.tone])}>
            {b.label}
          </span>
          <Path items={b.path} {...rest} />
        </div>
      ))}
    </div>
  )
}

function Node({ step, n, selected, onSelect }: { step: FlowStep; n: number; selected: boolean; onSelect: (id: string | null) => void }) {
  const decision = step.kind === "Question" || step.kind === "Choose a path"
  return (
    <button
      type="button"
      data-node={step.id}
      onClick={() => onSelect(selected ? null : step.id)}
      aria-pressed={selected}
      className={cn(
        "flex w-[210px] flex-col gap-1 rounded-[10px] border bg-card px-3 py-2.5 text-left text-sm shadow-xs transition hover:border-zinc-400",
        decision && "border-violet-200 dark:border-violet-900",
        step.setup && "border-orange-300 dark:border-orange-800",
        step.end && "border-green-200 dark:border-green-900",
        selected && "border-primary ring-[3px] ring-ring/40"
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className="inline-grid size-[20px] place-items-center rounded-md text-[10px] font-semibold text-white"
          style={{ background: FLOW_KIND_COLOR[step.kind] }}
        >
          {n}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">{step.kind}</span>
        {step.end ? <span className="ml-auto text-[11px] text-green-700 dark:text-green-400">Ends</span> : null}
      </span>
      <span className="leading-snug font-medium">{step.title}</span>
      <span className="text-xs leading-snug text-muted-foreground">{step.sub}</span>
      {step.setup ? (
        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 dark:text-orange-400">
          <TriangleAlert className="size-3" /> {step.setup}
        </span>
      ) : null}
    </button>
  )
}
