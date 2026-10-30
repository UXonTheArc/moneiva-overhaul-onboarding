"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AgentKind } from "@/lib/moneiva/agents-data"
import { KINDS, PROFILE_OPTIONS } from "@/lib/moneiva/agents-extra-data"
import { cn } from "@/lib/utils"

import { KindIcon } from "./kind-icon"

export function CreateAgentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [kind, setKind] = useState<AgentKind>("email")
  const [name, setName] = useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create an agent</DialogTitle>
          <DialogDescription>Pick the channel it works. You can&apos;t change this later.</DialogDescription>
        </DialogHeader>
        <div role="radiogroup" aria-label="Channel" className="grid grid-cols-2 gap-2.5">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              role="radio"
              aria-checked={kind === k.kind}
              onClick={() => setKind(k.kind)}
              className={cn(
                "flex flex-col gap-1.5 rounded-[10px] border bg-card p-3 text-left text-sm hover:bg-accent/50",
                kind === k.kind && "border-primary ring-[3px] ring-ring/40"
              )}
            >
              <KindIcon kind={k.kind} size="sm" />
              <span className="font-medium">{k.label}</span>
              <span className="text-xs leading-snug text-muted-foreground">{k.sub}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-agent-name">Name</Label>
          <Input id="new-agent-name" placeholder="For example, Billing questions" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Works for</Label>
          <Select defaultValue={PROFILE_OPTIONS.team[0]}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFILE_OPTIONS.team.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          New agents start Off, with every request type in Learn. Nothing goes out until you turn it on.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              toast.success(`${name.trim() || "New agent"} created. It is off until you turn it on.`)
              setName("")
            }}
          >
            Create agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
