import { Brain } from "lucide-react"

import { NeedsSetup } from "@/components/moneiva/clean/gate"
import { Page } from "@/components/moneiva/page-header"
import { OperatorOverview } from "@/components/moneiva/operator/operator-overview"

export default function OperatorPage() {
  return (
    <Page title="The Operator">
      <NeedsSetup icon={<Brain />} title="Your Operator hasn't started learning" sub="Connect your email and add a few documents in setup. The Operator reads them and starts learning how your team works.">
        <OperatorOverview />
      </NeedsSetup>
    </Page>
  )
}
