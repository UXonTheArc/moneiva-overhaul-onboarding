import { Suspense } from "react"

import { AgentsList } from "@/components/moneiva/agents/agents-list"
import { Page } from "@/components/moneiva/page-header"

export default function AgentsPage() {
  return (
    <Page title="Task agents">
      <Suspense>
        <AgentsList />
      </Suspense>
    </Page>
  )
}
