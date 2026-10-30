import { cn } from "@/lib/utils"
import { STAGES, type Stage } from "@/lib/moneiva/data"

/** Four short bars; one more is filled at each stage from Learn to Autopilot. */
export function StageMeter({ stage, className }: { stage: Stage; className?: string }) {
  const filled = STAGES.indexOf(stage) + 1
  return (
    <span role="img" aria-label={stage} className={cn("inline-flex gap-0.5", className)}>
      {STAGES.map((s, i) => (
        <i key={s} className={cn("h-1 w-3 rounded-full", i < filled ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700")} />
      ))}
    </span>
  )
}
