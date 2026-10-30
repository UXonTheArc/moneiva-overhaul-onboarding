import { Suspense } from "react"

import { InboxView, type DoneKind, type Filter, type InboxInitial, type Sub } from "@/components/moneiva/inbox/inbox-view"
import { Page } from "@/components/moneiva/page-header"
import { DONT_SEND_REASONS, inboxItemById } from "@/lib/moneiva/inbox-data"

const FILTERS: Filter[] = ["all", "reply", "call", "new"]
const SUBS: Sub[] = ["main", "thread", "checks"]
const DONE_KINDS: DoneKind[] = ["sent", "edited", "notsent", "called", "done", "nocall", "named", "merged", "ignored"]

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

/**
 * Inbox. Deep links:
 *   ?item=r1|r2|r3|r4|c1|n1|n2|n3   select an item (default r2)
 *   ?view=thread|checks             open the Email thread / Transcript / Example emails, or What it checked tab
 *   ?filter=reply|call|new          filter the list
 *   ?menu=type                      open the request type menu
 *   ?edit=1                         Edit, then send
 *   ?dialog=dont|rule               Don't send, or Make this a rule
 *   ?done=sent|edited|notsent|...   show the item as already handled
 */
export default function InboxPage({ searchParams }: PageProps<"/inbox">) {
  return (
    <Page title="Inbox">
      <Suspense>
        <InboxContent searchParams={searchParams} />
      </Suspense>
    </Page>
  )
}

async function InboxContent({ searchParams }: { searchParams: PageProps<"/inbox">["searchParams"] }) {
  const sp = await searchParams
  const item = inboxItemById(one(sp.item)) ?? inboxItemById("r2")!
  const filter = FILTERS.find((f) => f === one(sp.filter)) ?? "all"
  const sub = SUBS.find((s) => s === one(sp.view)) ?? "main"
  const doneKind = DONE_KINDS.find((d) => d === one(sp.done))
  const dialog = one(sp.dialog)
  const reason = DONT_SEND_REASONS.find((r) => r === one(sp.reason)) ?? (dialog === "dont" || doneKind === "notsent" ? "No reply is needed" : "The information is wrong")

  const initial: InboxInitial = {
    filter: filter !== "all" && item.kind !== filter ? "all" : filter,
    sel: item.id,
    sub: item.kind === "new" && sub === "checks" ? "main" : sub,
    dialog: (dialog === "rule" && item.kind !== "new") || (dialog === "dont" && item.kind === "reply") ? dialog : null,
    editing: one(sp.edit) === "1" && item.kind === "reply",
    typeMenu: one(sp.menu) === "type",
    done: doneKind ? { [item.id]: doneKind } : {},
    reason,
  }
  const key = new URLSearchParams(Object.entries(sp).map(([k, v]) => [k, one(v as string | string[] | undefined) ?? ""])).toString()

  return <InboxView key={key} initial={initial} />
}
