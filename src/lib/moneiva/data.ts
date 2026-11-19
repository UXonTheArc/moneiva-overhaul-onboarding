// Shared mockup data. Everything here is synthetic (example.test addresses, (555) 010 numbers).

export const STAGES = ["Learn", "Shadow", "Review", "Autopilot"] as const
export type Stage = (typeof STAGES)[number]

export type AgentStatus = "live" | "test" | "paused" | "off" | "error" | "archived"

export const ORG = { name: "Acme Logistics", initials: "AL" }
export const ME = { name: "Taylor Morgan", email: "taylor@example.test", initials: "TM" }

/**
 * Request types and where each one is on the Operator's journey.
 * Learn: line = an example email subject.
 * Shadow: matched of predictions matched your team.
 * Review: matched of replies approved as written.
 */
export type RequestType = { name: string; stage: Stage; matched: number; of: number; line: string; flag: "" | "name" | "ready" }
export const REQUEST_TYPES: RequestType[] = [
  { name: "Pickup status without a reference", stage: "Learn", matched: 0, of: 0, line: "Pickup yesterday", flag: "name" },
  { name: "Freight charges inquiry by PRO", stage: "Learn", matched: 0, of: 0, line: "Pricing on our last shipment", flag: "name" },
  { name: "Freight charges on an existing shipment", stage: "Learn", matched: 0, of: 0, line: "PRO 0300100123 Freight Charges", flag: "name" },
  { name: "PRO tracking request", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Confirmation on a pickup", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Billing or rate dispute", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Delivery bounce notice", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Missed pickup recovery", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "New pickup request", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Reconsignment request", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Document request or correction", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Delivery appointment", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Pickup change request", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Address correction", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "ETA or status request", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Proof of delivery request", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Auto-reply or out of office", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Hold at terminal request", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" },
  { name: "Weight or class inspection", stage: "Learn", matched: 0, of: 0, line: "Found in your past email", flag: "" }
]

export type Rule = { text: string; requestType: string; source: string; by: string; on: string; active: boolean }
export const RULES: Rule[] = []

export type Doc = { name: string; kind: string; facts: string; by: string; on: string; state: string }
export const DOCS: Doc[] = [
  { name: "Northwind routing guide.pdf", kind: "PDF", facts: "9 facts", by: "Taylor Morgan", on: "Sep 16", state: "Read" },
  { name: "Acme rate and accessorial sheet.pdf", kind: "PDF", facts: "5 facts", by: "Jordan Lee", on: "Sep 16", state: "Read" },
  { name: "Dock hours and addresses.xlsx", kind: "Spreadsheet", facts: "26 facts", by: "Jordan Lee", on: "Sep 18", state: "Read" },
  { name: "Customer service handbook.docx", kind: "Word document", facts: "Not finished", by: "Taylor Morgan", on: "Oct 9", state: "Reading" }
]
