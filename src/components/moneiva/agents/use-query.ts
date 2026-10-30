"use client"

import { useSearchParams } from "next/navigation"
import { useCallback } from "react"

/**
 * Read and write UI state kept in the URL (tab, open sheet, selected step), so every state is deep-linkable.
 * Writes use history.replaceState, which Next syncs into useSearchParams without a server round trip.
 * Callers must sit under a <Suspense> boundary.
 */
export function useQuery() {
  const params = useSearchParams()
  const set = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(window.location.search)
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") next.delete(k)
        else next.set(k, v)
      }
      const qs = next.toString()
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
    },
    []
  )
  return { get: (k: string) => params.get(k), set }
}
