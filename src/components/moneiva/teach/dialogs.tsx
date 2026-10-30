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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { REQUEST_TYPES } from "@/lib/moneiva/data"

const ALL = "All request types"
const NEW_ONE = "Name a new one"

/** Request type names for a picker, with the current one first when it is not a known type yet. */
function typeOptions(current: string, withAll: boolean) {
  const names = REQUEST_TYPES.map((t) => t.name)
  const list = names.includes(current) || current === ALL ? names : [current, ...names]
  return withAll ? [ALL, ...list] : list
}

export type NewRule = { requestType: string; when: string; then: string; text: string }

function ruleText(when: string, then: string) {
  const t = then.trim()
  return `When ${when.trim()}, ${t.charAt(0).toLowerCase()}${t.slice(1)}`
}

/** Make a rule: Applies to, When, Then and a live preview. Used by Playbook and Training. */
export function RuleDialog({
  open,
  onOpenChange,
  requestType,
  when: initialWhen = "",
  then: initialThen = "",
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestType: string
  when?: string
  then?: string
  onSave: (rule: NewRule) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <RuleForm
            requestType={requestType}
            initialWhen={initialWhen}
            initialThen={initialThen}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function RuleForm({
  requestType,
  initialWhen,
  initialThen,
  onCancel,
  onSave,
}: {
  requestType: string
  initialWhen: string
  initialThen: string
  onCancel: () => void
  onSave: (rule: NewRule) => void
}) {
  const [type, setType] = useState(requestType)
  const [when, setWhen] = useState(initialWhen)
  const [then, setThen] = useState(initialThen)
  const ready = when.trim() !== "" && then.trim() !== ""
  return (
    <>
      <DialogHeader>
        <DialogTitle>Make a rule</DialogTitle>
        <DialogDescription>
          Rules apply to every email of this request type. You can turn a rule off on the Playbook Rules tab.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rule-type">Applies to</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="rule-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions(requestType, true).map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rule-when">When</Label>
          <Input id="rule-when" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="the customer asks for..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rule-then">Then</Label>
          <Textarea
            id="rule-then"
            value={then}
            onChange={(e) => setThen(e.target.value)}
            placeholder="what the Operator should do"
            className="min-h-16"
          />
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-muted/50 px-3.5 py-3 text-sm">
          <span className="text-xs text-muted-foreground">Preview</span>
          <span>
            For {type}, when {when || "..."}: {then || "..."}
          </span>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!ready} onClick={() => onSave({ requestType: type, when, then, text: ruleText(when, then) })}>
          Save rule
        </Button>
      </DialogFooter>
    </>
  )
}

export type Correction = { requestType: string; fix: string; alsoRule: boolean }

/** Not right: what should have happened, with an option to also save it as a rule. */
export function NotRightDialog({
  open,
  onOpenChange,
  requestType,
  fix,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestType: string
  fix: string
  onSave: (c: Correction) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <NotRightForm requestType={requestType} fix={fix} onCancel={() => onOpenChange(false)} onSave={onSave} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function NotRightForm({
  requestType,
  fix: initialFix,
  onCancel,
  onSave,
}: {
  requestType: string
  fix: string
  onCancel: () => void
  onSave: (c: Correction) => void
}) {
  const [type, setType] = useState(requestType)
  const [fix, setFix] = useState(initialFix)
  const [alsoRule, setAlsoRule] = useState(false)
  return (
    <>
      <DialogHeader>
        <DialogTitle>What should have happened?</DialogTitle>
        <DialogDescription>Your correction teaches the Operator. It shows up in Playbook under this request type.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fix-type">Request type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="fix-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions(requestType, false).map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={NEW_ONE}>{NEW_ONE}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            Pick the right one, or choose &quot;Name a new one&quot; at the bottom of the list.
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fix-text">What should the Operator have done?</Label>
          <Textarea
            id="fix-text"
            value={fix}
            onChange={(e) => setFix(e.target.value)}
            placeholder="Describe what the Operator should have done."
            className="min-h-16"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={alsoRule} onCheckedChange={(v) => setAlsoRule(v === true)} />
          Also save this as a rule
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave({ requestType: type, fix, alsoRule })}>Save correction</Button>
      </DialogFooter>
    </>
  )
}
