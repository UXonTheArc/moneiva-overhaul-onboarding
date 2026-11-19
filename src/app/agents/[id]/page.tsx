import { notFound } from "next/navigation"
import { Suspense } from "react"

import { AgentDetail } from "@/components/moneiva/agents/agent-detail"
import { AgentGate } from "@/components/moneiva/clean/gate"
import { Page } from "@/components/moneiva/page-header"
import { AGENTS, agentById, isLearning } from "@/lib/moneiva/agents-data"

export function generateStaticParams() {
  return AGENTS.map((a) => ({ id: a.id }))
}

export default async function AgentPage({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params
  const agent = agentById(id)
  if (!agent) notFound()
  return (
    <Page title={isLearning(agent) ? "The Operator" : "Task agents"}>
      <Suspense>
        <AgentGate id={agent.id}>
          <AgentDetail id={agent.id} />
        </AgentGate>
      </Suspense>
    </Page>
  )
}
