import { Suspense } from "react"

import { AutomationDetail } from "@/components/moneiva/agents/automation-detail"
import { Page } from "@/components/moneiva/page-header"

export default function DamageReportPage() {
  return (
    <Page title="Damage report follow-up">
      <Suspense>
        <AutomationDetail />
      </Suspense>
    </Page>
  )
}
