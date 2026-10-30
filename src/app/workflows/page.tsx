import { Suspense } from "react"

import { AutomationsList } from "@/components/moneiva/agents/automations-list"
import { Page } from "@/components/moneiva/page-header"

export default function WorkflowsPage() {
  return (
    <Page title="Workflows">
      <Suspense>
        <AutomationsList />
      </Suspense>
    </Page>
  )
}
