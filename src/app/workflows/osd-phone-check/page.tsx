import { Suspense } from "react"

import { PhoneCheckDetail } from "@/components/moneiva/agents/phone-check-detail"
import { Page } from "@/components/moneiva/page-header"

export default function PhoneCheckPage() {
  return (
    <Page title="OS&D phone check">
      <Suspense>
        <PhoneCheckDetail />
      </Suspense>
    </Page>
  )
}
