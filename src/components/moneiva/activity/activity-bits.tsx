import { Check, Mail, MessageCircle, Phone, PhoneOutgoing } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ActivityChannel, ActivityStatus } from "@/lib/moneiva/activity-data"
import { ToneBadge } from "@/components/moneiva/status"

const CHANNEL_ICON: Record<ActivityChannel, typeof Mail> = {
  Email: Mail,
  "Inbound call": Phone,
  "Outbound call": PhoneOutgoing,
  "Text message": MessageCircle,
}

export function ChannelIcon({ channel, className }: { channel: ActivityChannel; className?: string }) {
  const Icon = CHANNEL_ICON[channel]
  return <Icon role="img" aria-label={channel} className={cn("size-3.5 flex-none text-muted-foreground", className)} />
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  switch (status) {
    case "needs":
      return <ToneBadge tone="amber">Needs you</ToneBadge>
    case "prog":
      return <ToneBadge tone="blue">In progress</ToneBadge>
    case "done":
      return (
        <span className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
          <Check className="size-3.5" aria-hidden />
          Done
        </span>
      )
    case "fail":
      return <ToneBadge tone="red">Couldn&apos;t finish</ToneBadge>
    case "ign":
      return <ToneBadge tone="muted">Ignored</ToneBadge>
  }
}
