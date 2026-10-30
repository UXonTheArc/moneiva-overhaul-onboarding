"use client"

import { Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { STATUS } from "@/components/moneiva/status"
import type { AgentStatus } from "@/lib/moneiva/data"
import { cn } from "@/lib/utils"

/** A menu item with an optional second line of muted text. */
export function MenuItem({ label, sub, danger, onSelect }: { label: string; sub?: string; danger?: boolean; onSelect?: () => void }) {
  return (
    <DropdownMenuItem variant={danger ? "destructive" : "default"} onSelect={onSelect}>
      <MenuItemBody label={label} sub={sub} />
    </DropdownMenuItem>
  )
}

export function MenuItemBody({ label, sub }: { label: string; sub?: string }) {
  return (
    <span className="flex flex-col leading-snug">
      <span>{label}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </span>
  )
}

/** Status button with a dot, opening a radio menu where each choice explains itself. */
export function StatusMenu({
  value,
  options,
  onChange,
}: {
  value: AgentStatus
  options: readonly { value: string; label: string; sub: string }[]
  onChange: (v: AgentStatus) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <i className={cn("size-2 rounded-full", STATUS[value].dot)} />
          {STATUS[value].label}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as AgentStatus)}>
          {options.map((o) => (
            <DropdownMenuRadioItem
              key={o.value}
              value={o.value}
              className="items-start py-2 pl-2 [&>span:first-child]:hidden"
            >
              <span className="grid w-4 place-items-center pt-0.5">{o.value === value ? <Check className="size-4" /> : null}</span>
              <i className={cn("mt-1.5 size-2 flex-none rounded-full", STATUS[o.value as AgentStatus].dot)} />
              <span className="flex flex-col leading-snug">
                <span className="font-medium">{o.label}</span>
                <span className="text-xs text-muted-foreground">{o.sub}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
