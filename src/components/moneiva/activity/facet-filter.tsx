"use client"

import * as React from "react"
import { PlusCircle, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export type FacetOption = { value: string; label: string; dot?: string }

/** Dashed "+ Title" button that opens a searchable checkbox list, like the shadcn data table filters. */
export function FacetFilter({
  title,
  options,
  selected,
  onChange,
  open,
  onOpenChange,
}: {
  title: string
  options: FacetOption[]
  selected: string[]
  onChange: (next: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = React.useState("")
  const shown = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) setQuery("")
        onOpenChange(o)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <PlusCircle />
          {title}
          {selected.length > 0 ? (
            <>
              <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
              {(selected.length > 2 ? [`${selected.length} selected`] : selected.map(labelOf)).map((s) => (
                <span key={s} className="rounded-sm bg-secondary px-1.5 text-xs font-normal">
                  {s}
                </span>
              ))}
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1">
        <label className="-mx-1 -mt-1 mb-1 flex h-9 items-center gap-2 border-b px-3 text-muted-foreground">
          <Search className="size-4 flex-none" aria-hidden />
          <input
            aria-label={`Search ${title}`}
            placeholder={title}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div role="group" aria-label={`${title} filter`} className="flex flex-col">
          {shown.map((o) => {
            const on = selected.includes(o.value)
            return (
              <label
                key={o.value}
                className="flex h-8 cursor-pointer items-center gap-2 rounded-sm px-2 text-[13px] hover:bg-accent"
              >
                <Checkbox checked={on} onCheckedChange={() => toggle(o.value)} />
                {o.dot ? <i className={cn("size-2 flex-none rounded-full", o.dot)} /> : null}
                <span>{o.label}</span>
              </label>
            )
          })}
          {shown.length === 0 ? <span className="px-2 py-2 text-[13px] text-muted-foreground">No results.</span> : null}
        </div>
        {selected.length > 0 ? (
          <>
            <Separator className="-mx-1 my-1 w-auto" />
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex h-8 w-full items-center justify-center rounded-sm text-[13px] hover:bg-accent"
            >
              Clear filters
            </button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
