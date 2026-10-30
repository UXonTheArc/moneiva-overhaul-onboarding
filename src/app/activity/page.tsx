import { Suspense } from "react"

import { Page, PageHeader } from "@/components/moneiva/page-header"
import { ActivityFromParams, ActivityView, EMPTY_FILTERS } from "@/components/moneiva/activity/activity-view"

export default function ActivityPage() {
  return (
    <Page title="Activity">
      <PageHeader
        title="Activity"
        description="Every email and call the Operator handled, and what happened."
        actions={
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <i className="size-2 rounded-full bg-green-600" />
            Live
          </span>
        }
      />
      <Suspense fallback={<ActivityView initial={{ tab: "summary", f: EMPTY_FILTERS }} />}>
        <ActivityFromParams />
      </Suspense>
    </Page>
  )
}
