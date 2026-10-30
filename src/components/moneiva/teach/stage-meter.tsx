import { cn } from "@/lib/utils"
import { STAGES, type Stage } from "@/lib/moneiva/data"

/** Four short dashes, filled up to the stage a request type has reached. */
export function StageMeter({ stage, className }: { stage: Stage; className?: string }) {
  const idx = STAGES.indexOf(stage)
  return (
    <span role="img" aria-label={stage} className={cn("inline-flex shrink-0 gap-[3px]", className)}>
      {STAGES.map((s, i) => (
        <i key={s} className={cn("h-[3px] w-3 rounded-full", i <= idx ? "bg-primary" : "bg-gray-200 dark:bg-gray-700")} />
      ))}
    </span>
  )
}
