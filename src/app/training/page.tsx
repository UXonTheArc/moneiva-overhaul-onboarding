import { Suspense } from "react"

import { Page } from "@/components/moneiva/page-header"
import { TrainingView } from "@/components/moneiva/teach/training-view"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

async function TrainingFromUrl({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const tab = one(sp.tab) === "shadow" ? "shadow" : "history"
  const thread = one(sp.thread) ?? null
  const st = one(sp.state)
  const phase = st === "empty" || st === "reading" ? st : "ready"
  return <TrainingView key={`${tab}|${thread}|${phase}`} initialTab={tab} initialThread={thread} initialPhase={phase} />
}

export default function TrainingPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Page title="Training">
      <Suspense fallback={null}>
        <TrainingFromUrl searchParams={searchParams} />
      </Suspense>
    </Page>
  )
}
