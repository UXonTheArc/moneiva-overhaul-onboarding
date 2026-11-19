"use client"

// A brand-new account. Nothing exists until setup creates it. Saved in this browser so a demo survives a refresh.
import { useSyncExternalStore } from "react"

import type { ReadScope } from "./inbox-sources-data"

export type SetupInbox = { address: string; provider: "Google Workspace" | "Microsoft 365"; scope: ReadScope; range: string; folders: string[]; threads: number }
export type SetupInvite = { email: string; role: string }
export type SetupState = {
  biz: { name: string; website: string; industry: string; tz: string; hours: string; sign: string }
  invites: SetupInvite[]
  inboxes: SetupInbox[]
  phone: boolean
  texts: boolean
  tms: boolean
  docs: string[]
  finishedAt: string
}

const KEY = "moneiva-onboarding-setup"
const listeners = new Set<() => void>()
let cache: SetupState | null | undefined

function read(): SetupState | null {
  if (cache !== undefined) return cache
  try {
    const raw = window.localStorage.getItem(KEY)
    cache = raw ? (JSON.parse(raw) as SetupState) : null
  } catch {
    cache = null
  }
  return cache
}

function emit() {
  listeners.forEach((l) => l())
}

export function saveSetup(s: SetupState) {
  cache = s
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
  emit()
}

export function resetSetup() {
  cache = null
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
  emit()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** null until setup has run. On the server and first paint it is always null. */
export function useSetup(): SetupState | null {
  return useSyncExternalStore(subscribe, read, () => null)
}

/** True once the browser has read storage, so a page doesn't flash its empty state for a set-up account. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

export const learningIds = (s: SetupState | null) => (s ? ["op", ...(s.phone ? ["phone"] : [])] : [])
