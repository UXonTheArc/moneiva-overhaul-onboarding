import { Suspense } from "react"

import { Page } from "@/components/moneiva/page-header"
import { TrainingView } from "@/components/moneiva/teach/training-view"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

async function TrainingFromUrl({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const tabParam = one(sp.tab)
  const tab = tabParam === "shadow" ? "shadow" : "history"
  const docs = tabParam === "documents"
  const doc = one(sp.doc) ?? null
  const thread = one(sp.thread) ?? null
  const st = one(sp.state)
  const phase = st === "empty" || st === "reading" ? st : "ready"
  return (
    <TrainingView
      key={`${tabParam}|${thread}|${phase}|${doc}`}
      initialTab={tab}
      initialThread={thread}
      initialPhase={phase}
      initialDocs={docs}
      initialDoc={doc}
    />
  )
}

export default function TeachPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Page title="Teach">
      <Suspense fallback={null}>
        <TrainingFromUrl searchParams={searchParams} />
      </Suspense>
    </Page>
  )
}
