"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Stage } from "@/lib/moneiva/data"
import { DONT_SEND_REASONS, INBOX_TYPES, type CallItem, type ReplyItem } from "@/lib/moneiva/inbox-data"

const FIELD_LABEL = "text-xs font-medium text-muted-foreground"

export function DontSendDialog({
  open,
  onOpenChange,
  item,
  reason,
  onReason,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  item: ReplyItem
  reason: string
  onReason: (r: string) => void
  onConfirm: (saveRule: boolean) => void
}) {
  const [instead, setInstead] = useState(item.instead)
  const [saveRule, setSaveRule] = useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-[18px]">
        <DialogHeader>
          <DialogTitle className="font-medium">Don&apos;t send this reply?</DialogTitle>
          <DialogDescription>
            Nothing goes to {item.from}. Tell the Operator why, so it learns. The email stays in Activity as Ignored.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <span className={FIELD_LABEL} id="why-not">
            Why not?
          </span>
          <RadioGroup value={reason} onValueChange={onReason} aria-labelledby="why-not" className="gap-0">
            {DONT_SEND_REASONS.map((r) => (
              <Label
                key={r}
                className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 font-normal hover:bg-muted"
              >
                <RadioGroupItem value={r} />
                {r}
              </Label>
            ))}
          </RadioGroup>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instead" className={FIELD_LABEL}>
            What should happen instead? (optional)
          </Label>
          <Textarea id="instead" value={instead} onChange={(e) => setInstead(e.target.value)} className="min-h-16" />
        </div>
        <Label className="flex cursor-pointer items-center gap-2 font-normal">
          <Checkbox checked={saveRule} onCheckedChange={(c) => setSaveRule(c === true)} />
          Also save this as a rule
        </Label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(saveRule)}>Don&apos;t send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RuleDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  item: ReplyItem | CallItem
  onSave: () => void
}) {
  const [type, setType] = useState(item.ruleType)
  const [when, setWhen] = useState(item.ruleWhen)
  const [then, setThen] = useState(item.ruleThen)
  const stages: Stage[] = ["Review", "Shadow", "Learn"]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-[18px]">
        <DialogHeader>
          <DialogTitle className="font-medium">Make a rule</DialogTitle>
          <DialogDescription>
            Rules apply to every email of this request type. You can turn a rule off on the Playbook Rules tab.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-type" className={FIELD_LABEL}>
            Applies to
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="rule-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectGroup key={s}>
                  <SelectLabel>{s}</SelectLabel>
                  {INBOX_TYPES.filter((t) => t.stage === s).map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-when" className={FIELD_LABEL}>
            When
          </Label>
          <Textarea id="rule-when" value={when} onChange={(e) => setWhen(e.target.value)} className="min-h-10" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-then" className={FIELD_LABEL}>
            Then
          </Label>
          <Textarea id="rule-then" value={then} onChange={(e) => setThen(e.target.value)} className="min-h-10" />
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-zinc-100 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <span className={FIELD_LABEL}>Preview</span>
          <span>
            For {type}, when {when}: {then}
          </span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
