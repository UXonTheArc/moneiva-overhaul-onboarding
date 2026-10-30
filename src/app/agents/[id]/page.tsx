import { notFound } from "next/navigation"
import { Suspense } from "react"

import { AgentDetail } from "@/components/moneiva/agents/agent-detail"
import { Page } from "@/components/moneiva/page-header"
import { AGENTS, agentById } from "@/lib/moneiva/agents-data"

export function generateStaticParams() {
  return AGENTS.map((a) => ({ id: a.id }))
}

export default async function AgentPage({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params
  const agent = agentById(id)
  if (!agent) notFound()
  return (
    <Page title="Agents">
      <Suspense>
        <AgentDetail id={agent.id} />
      </Suspense>
    </Page>
  )
}
