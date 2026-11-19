import { SetupWizard } from "@/components/moneiva/setup/setup-wizard"

/** First-run setup. Full screen, with no app nav, since nothing exists yet. */
export default function SetupPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <SetupWizard />
    </div>
  )
}
