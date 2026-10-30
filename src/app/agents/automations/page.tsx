import { redirect } from "next/navigation"

/** Workflows moved out of Agents to their own page. */
export default function OldAutomationsPage() {
  redirect("/workflows")
}
