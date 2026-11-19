import { redirect } from "next/navigation"

// Training is now called Teach.
export default function TrainingRedirect() {
  redirect("/teach")
}
