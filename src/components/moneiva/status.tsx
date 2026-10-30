import { cn } from "@/lib/utils"
import type { AgentStatus, Stage } from "@/lib/moneiva/data"

/** Stage colors: Learn gray, Shadow blue, Review amber, Autopilot green. */
export const STAGE_CLASS: Record<Stage, string> = {
  Learn: "bg-muted text-muted-foreground border-transparent",
  Shadow: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900",
  Review: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  Autopilot: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-900",
}

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-md border px-2 text-xs font-medium", STAGE_CLASS[stage], className)}>
      {stage}
    </span>
  )
}

/** Tone badges used for results: amber = needs you, red = couldn't finish, green = done. */
export const TONE_CLASS = {
  muted: "bg-muted text-muted-foreground border-transparent",
  blue: STAGE_CLASS.Shadow,
  amber: STAGE_CLASS.Review,
  green: STAGE_CLASS.Autopilot,
  red: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900",
} as const
export type Tone = keyof typeof TONE_CLASS

export function ToneBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium", TONE_CLASS[tone], className)}>
      {children}
    </span>
  )
}

export const STATUS: Record<AgentStatus, { label: string; dot: string }> = {
  live: { label: "Live", dot: "bg-green-600" },
  test: { label: "Test only", dot: "bg-blue-600" },
  paused: { label: "Paused", dot: "bg-amber-500" },
  off: { label: "Off", dot: "bg-zinc-300" },
  error: { label: "Error", dot: "bg-red-600" },
  archived: { label: "Archived", dot: "bg-zinc-300" },
}

export function StatusDot({ status, className }: { status: AgentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", status === "off" && "text-muted-foreground", className)}>
      <i className={cn("size-2 rounded-full", STATUS[status].dot)} />
      {STATUS[status].label}
    </span>
  )
}
