// The team inboxes the Operator learns from. Each one is answered by a learning agent. Synthetic.

export type ReadScope = "all" | "folders" | "new"
export type InboxSource = {
  address: string
  provider: "Gmail" | "Microsoft 365"
  scope: ReadScope
  /** How far back, for "all". Folder names, for "folders". */
  range?: string
  folders?: string[]
  agent: string
  agentHref: string
  state: "live" | "reading" | "watching"
  read: number
  total?: number
  since: string
}

export const SCOPE_LABEL: Record<ReadScope, string> = {
  all: "All email history",
  folders: "Specific folders",
  new: "Only new email from now on",
}

export const SCOPE_SUB: Record<ReadScope, string> = {
  all: "Best start. It learns from everything your team already answered.",
  folders: "Only the folders you pick, like Customer service or Claims.",
  new: "Nothing from the past. It starts learning from the next email.",
}

export const RANGES = ["Last 3 months", "Last 6 months", "Last 12 months", "Everything"] as const

/** Folders offered when a mailbox is connected. */
export const FOLDERS = [
  { name: "Inbox", count: 1240 },
  { name: "Customer service", count: 860 },
  { name: "Billing disputes", count: 210 },
  { name: "Claims", count: 145 },
  { name: "Carriers", count: 390 },
  { name: "Newsletters", count: 620 },
]

export const INBOXES: InboxSource[] = [
  {
    address: "service@example.test",
    provider: "Gmail",
    scope: "all",
    range: "Last 6 months",
    agent: "Email and texts",
    agentHref: "/agents/op",
    state: "live",
    read: 1240,
    since: "Connected Sep 16 by Taylor Morgan",
  },
  {
    address: "billing@example.test",
    provider: "Microsoft 365",
    scope: "folders",
    folders: ["Billing disputes", "Inbox"],
    agent: "Email and texts",
    agentHref: "/agents/op",
    state: "reading",
    read: 472,
    total: 1450,
    since: "Connected today by Taylor Morgan",
  },
  {
    address: "claims@example.test",
    provider: "Gmail",
    scope: "new",
    agent: "Email and texts",
    agentHref: "/agents/op",
    state: "watching",
    read: 18,
    since: "Connected Nov 3 by Jordan Lee",
  },
]

export function scopeLine(i: InboxSource) {
  if (i.scope === "all") return `All history · ${i.range}`
  if (i.scope === "folders") return `${i.folders!.length} folders · ${i.folders!.join(", ")}`
  return "New email only"
}
