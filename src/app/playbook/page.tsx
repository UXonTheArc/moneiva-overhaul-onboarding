import { Suspense } from "react"

import { Page } from "@/components/moneiva/page-header"
import { PlaybookView, type PlaybookTab } from "@/components/moneiva/teach/playbook-view"
import { STAGES, type Stage } from "@/lib/moneiva/data"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

async function PlaybookFromUrl({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const tabParam = one(sp.tab)
  const tab: PlaybookTab = tabParam === "rules" ? "rules" : tabParam === "documents" ? "documents" : "types"
  const stageParam = one(sp.stage)
  const stage = STAGES.includes(stageParam as Stage) ? (stageParam as Stage) : "All"
  const type = one(sp.type) ?? null
  const doc = one(sp.doc) ?? null
  // key: a link to another stage, type or tab from inside the page starts fresh from the URL
  return <PlaybookView key={`${tab}|${stage}|${type}|${doc}`} initialTab={tab} initialStage={stage} initialType={type} initialDoc={doc} />
}

export default function PlaybookPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Page title="Playbook">
      <Suspense fallback={null}>
        <PlaybookFromUrl searchParams={searchParams} />
      </Suspense>
    </Page>
  )
}
