"use client"

import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

/** A card section with a bold title and a muted line under it. */
export function Section({ title, sub, children, className, aside }: { title: string; sub?: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <Card className={cn("gap-3.5 px-[22px] py-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold">{title}</h2>
          {sub ? <p className="text-[13px] text-muted-foreground">{sub}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </Card>
  )
}

/** Label on the left, control on the right. Stacks on narrow screens. */
export function FormRow({ label, htmlFor, hint, children, labelWidth = 180 }: { label: string; htmlFor?: string; hint?: ReactNode; children: ReactNode; labelWidth?: number }) {
  return (
    <div className="grid grid-cols-1 items-start gap-1.5 sm:grid-cols-[var(--lw)_minmax(0,1fr)] sm:gap-4" style={{ "--lw": `${labelWidth}px` } as React.CSSProperties}>
      <Label htmlFor={htmlFor} className="font-normal text-muted-foreground sm:pt-2.5">
        {label}
      </Label>
      <div className="flex min-w-0 flex-col gap-1">
        {children}
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  )
}

/** A Select from a plain list of strings. */
export function SimpleSelect({
  id,
  value,
  defaultValue,
  options,
  onChange,
  className,
  label,
  wrap,
  size,
}: {
  id?: string
  value?: string
  defaultValue?: string
  options: string[]
  onChange?: (v: string) => void
  className?: string
  label?: string
  /** Let a long value wrap instead of cutting it off. */
  wrap?: boolean
  size?: "sm" | "default"
}) {
  return (
    <Select value={value} defaultValue={defaultValue} onValueChange={onChange}>
      <SelectTrigger size={size} id={id} aria-label={label} className={cn("w-full", wrap && "min-h-9 py-2 text-left whitespace-normal data-[size=default]:h-auto *:data-[slot=select-value]:line-clamp-none", className)}>
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
