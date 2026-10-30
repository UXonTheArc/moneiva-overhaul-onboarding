import { File, Mail, Phone, PhoneOutgoing } from "lucide-react"

import type { AgentKind } from "@/lib/moneiva/agents-data"
import { cn } from "@/lib/utils"

const ICONS = { email: Mail, inbound: Phone, outbound: PhoneOutgoing, files: File }

/** The agent's channel icon in a soft blue tile. */
export function KindIcon({ kind, size = "md", className }: { kind: AgentKind; size?: "sm" | "md" | "lg"; className?: string }) {
  const Icon = ICONS[kind]
  return (
    <span
      className={cn(
        "inline-grid flex-none place-items-center bg-indigo-50 text-blue-800 dark:bg-indigo-950 dark:text-blue-200",
        size === "sm" && "size-8 rounded-lg [&>svg]:size-4",
        size === "md" && "size-[38px] rounded-[10px] [&>svg]:size-[18px]",
        size === "lg" && "size-11 rounded-xl [&>svg]:size-[22px]",
        className
      )}
    >
      <Icon aria-hidden="true" />
    </span>
  )
}
