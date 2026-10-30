"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PERIODS = ["Today", "Last 7 days", "Last 30 days", "Last 90 days"]

/** Date range picker. The mockup's numbers don't change with it. */
export function PeriodMenu({ initial = "Last 30 days", size = "default" }: { initial?: string; size?: "default" | "sm" }) {
  const [period, setPeriod] = React.useState(initial)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size}>
          {period}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={period} onValueChange={setPeriod}>
          {PERIODS.map((p) => (
            <DropdownMenuRadioItem key={p} value={p}>
              {p}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
