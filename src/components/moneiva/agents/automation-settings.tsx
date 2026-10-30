"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SETTINGS } from "@/lib/moneiva/automations-data"

import { FormRow, Section, SimpleSelect } from "./form-row"

export function AutomationSettings({ onArchive }: { onArchive: () => void }) {
  const [formKey, setFormKey] = useState(0)
  return (
    <div key={formKey} className="flex max-w-[760px] flex-col gap-4">
      {SETTINGS.map((sec) => (
        <Section key={sec.title} title={sec.title} sub={sec.sub}>
          {sec.fields.map((f) => {
            const id = `set-${f.label.replace(/\W+/g, "-").toLowerCase()}`
            return (
              <FormRow key={f.label} label={f.label} htmlFor={id} hint={f.hint} labelWidth={200}>
                {f.options ? <SimpleSelect id={id} defaultValue={f.value} options={f.options} /> : <Input id={id} defaultValue={f.value} />}
              </FormRow>
            )
          })}
        </Section>
      ))}
      <Card className="flex-row flex-wrap items-center justify-between gap-4 border-red-200 px-[22px] py-5 dark:border-red-900">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold">Archive this workflow</h2>
          <p className="text-[13px] text-muted-foreground">It stops running and moves to the Archived tab. Its run history stays.</p>
        </div>
        <Button variant="destructive" onClick={onArchive}>
          Archive
        </Button>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setFormKey((k) => k + 1)}>
          Cancel
        </Button>
        <Button onClick={() => toast.success("Settings saved. They apply to the next run.")}>Save settings</Button>
      </div>
    </div>
  )
}
