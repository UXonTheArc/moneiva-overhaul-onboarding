"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Pause,
  Pencil,
  Phone,
  Play,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/moneiva/page-header";
import {
  STAGE_CLASS,
  StageBadge,
  ToneBadge,
} from "@/components/moneiva/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/moneiva/data";
import {
  INBOX_TYPES,
  inboxItems,
  stageOfType,
  type InboxItem,
  type InboxKind,
  type ReplyItem,
} from "@/lib/moneiva/inbox-data";

import { DontSendDialog, RuleDialog } from "./inbox-dialogs";

export type Filter = "all" | InboxKind;
export type Sub = "main" | "thread" | "checks";
export type DoneKind =
  | "sent"
  | "edited"
  | "notsent"
  | "called"
  | "done"
  | "nocall"
  | "named"
  | "merged"
  | "ignored";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reply", label: "Replies" },
  { id: "call", label: "Calls" },
  { id: "new", label: "New request types" },
];

const DONE: Record<DoneKind, { label: string; text: string; ok: boolean }> = {
  sent: { label: "Sent", text: "Reply sent to ", ok: true },
  edited: {
    label: "Sent with your edits",
    text: "Your edited reply was sent to ",
    ok: true,
  },
  notsent: {
    label: "Not sent",
    text: "Not sent. Your reason was saved, and the Operator will learn from it. ",
    ok: false,
  },
  called: { label: "Called back", text: "Marked as called back.", ok: true },
  done: { label: "Done", text: "Marked as done.", ok: true },
  nocall: { label: "No call needed", text: "Closed with no call.", ok: false },
  named: {
    label: "Named",
    text: "Named. It is now in Playbook under Learn.",
    ok: true,
  },
  merged: {
    label: "Merged",
    text: "Merged. These emails now count toward the type you picked.",
    ok: true,
  },
  ignored: {
    label: "Ignored",
    text: "Ignored. The Operator won't suggest this kind again.",
    ok: false,
  },
};

const AVATAR = [
  "bg-blue-100 dark:bg-blue-950",
  "bg-indigo-100 dark:bg-indigo-950",
  "bg-green-100 dark:bg-green-950",
  "bg-amber-100 dark:bg-amber-950",
];

const SUBS: Record<InboxKind, { id: Sub; label: string }[]> = {
  reply: [
    { id: "main", label: "Suggested reply" },
    { id: "thread", label: "Email thread" },
    { id: "checks", label: "What it checked" },
  ],
  call: [
    { id: "main", label: "Summary" },
    { id: "thread", label: "Transcript" },
    { id: "checks", label: "What it checked" },
  ],
  new: [
    { id: "main", label: "Details" },
    { id: "thread", label: "Example emails" },
  ],
};

function initials(n: string) {
  return n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export type InboxInitial = {
  filter: Filter;
  sel: string | null;
  sub: Sub;
  dialog: "rule" | "dont" | null;
  editing: boolean;
  typeMenu: boolean;
  done: Record<string, DoneKind>;
  reason: string;
};

export function InboxView({ initial }: { initial: InboxInitial }) {
  const [filter, setFilter] = useState<Filter>(initial.filter);
  const [sel, setSelState] = useState<string | null>(initial.sel);
  const [sub, setSub] = useState<Sub>(initial.sub);
  const [dialog, setDialog] = useState<"rule" | "dont" | null>(initial.dialog);
  const [editing, setEditing] = useState(initial.editing);
  const [typeMenu, setTypeMenu] = useState(initial.typeMenu);
  const [done, setDone] = useState<Record<string, DoneKind>>(initial.done);
  const [types, setTypes] = useState<Record<string, string>>({});
  const [reason, setReason] = useState(initial.reason);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [team, setTeam] = useState("all");

  const list = inboxItems.filter((i) => filter === "all" || i.kind === filter);
  const cur = inboxItems.find((i) => i.id === sel) ?? null;

  function select(id: string | null) {
    setSelState(id);
    setSub("main");
    setEditing(false);
    setTypeMenu(false);
    try {
      window.history.replaceState(
        null,
        "",
        id ? `/inbox?item=${id}` : "/inbox",
      );
    } catch {}
  }

  function pickFilter(f: Filter) {
    setFilter(f);
    const l = inboxItems.filter((i) => f === "all" || i.kind === f);
    select(l[0]?.id ?? null);
  }

  function goNext(doneNow = done) {
    const idx = list.findIndex((i) => i.id === sel);
    for (let k = 1; k <= list.length; k++) {
      const i = list[(idx + k) % list.length];
      if (!doneNow[i.id]) {
        select(i.id);
        return;
      }
    }
    select(null);
  }

  function finish(kind: DoneKind) {
    if (!cur) return;
    setDone((d) => ({ ...d, [cur.id]: kind }));
    setEditing(false);
    setDialog(null);
    setTypeMenu(false);
  }

  const typeNow =
    cur && cur.kind !== "new" ? (types[cur.id] ?? cur.type) : null;
  const doneNow = cur ? done[cur.id] : undefined;

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Everything that needs a person. Nothing goes out until someone on your team says so."
        actions={
          <>
            <Tabs
              value={filter}
              onValueChange={(v) => pickFilter(v as Filter)}
              className="min-w-0 max-w-full"
            >
              <TabsList className="max-w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-none">
                {FILTERS.map((f) => (
                  <TabsTrigger key={f.id} value={f.id} className="gap-2 px-3">
                    {f.label}
                    <CountBadge
                      n={
                        inboxItems.filter(
                          (i) => f.id === "all" || i.kind === f.id,
                        ).length
                      }
                    />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {team === "all"
                    ? "All teams"
                    : team === "cs"
                      ? "Customer service"
                      : "Billing"}
                  <ChevronDown className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuRadioGroup value={team} onValueChange={setTeam}>
                  <DropdownMenuRadioItem value="all">
                    All teams
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="cs">
                    Customer service
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="billing">
                    Billing
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Card className="flex min-h-[860px] flex-col gap-0 overflow-hidden p-0 lg:flex-row">
        {/* List */}
        <div className="flex flex-col border-b lg:w-[340px] lg:flex-none lg:border-r lg:border-b-0">
          <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">
            Oldest first
          </div>
          {list.map((i) => (
            <ListRow
              key={i.id}
              item={i}
              on={cur?.id === i.id}
              done={done[i.id]}
              onPick={() => select(i.id)}
            />
          ))}
          {list.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground">
              Nothing here right now.
            </div>
          ) : null}
        </div>

        {/* Detail */}
        {cur ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-col gap-3.5 border-b px-6 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-medium">
                  {cur.kind === "new" ? cur.name : cur.subject}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => goNext()}>
                  Next
                  <ChevronRight />
                </Button>
              </div>

              {cur.kind !== "new" ? (
                <div className="flex items-center gap-2.5">
                  <span className="inline-grid size-8 flex-none place-items-center rounded-full bg-blue-100 text-xs font-semibold text-gray-700 dark:bg-blue-950 dark:text-gray-200">
                    {initials(cur.from)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-snug">
                    <span>
                      <span className="font-medium">{cur.from}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {cur.company}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      {cur.kind === "call" ? (
                        <Phone className="size-3.5" aria-label="Inbound call" />
                      ) : null}
                      {cur.addr}
                    </span>
                  </span>
                  <span className="text-right text-[13px] leading-snug text-muted-foreground">
                    {cur.when}
                    <br />
                    <span className="text-amber-700 dark:text-amber-400">
                      waiting {cur.wait}
                    </span>
                  </span>
                </div>
              ) : null}

              <Popover open={typeMenu} onOpenChange={setTypeMenu}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="w-24 text-xs font-medium text-muted-foreground">
                    {cur.kind === "new" ? "Stage" : "Request type"}
                  </span>
                  <PopoverAnchor asChild>
                    <span className="flex flex-wrap items-center gap-2.5">
                      {cur.kind === "new" ? (
                        <>
                          <ToneBadge tone="muted">New request type</ToneBadge>
                          <ToneBadge tone="muted">Learn, once named</ToneBadge>
                        </>
                      ) : typeNow ? (
                        <>
                          <ToneBadge tone="muted">{typeNow}</ToneBadge>
                          <StageBadge stage={stageOfType(typeNow)} />
                          {!doneNow ? (
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Change
                              </Button>
                            </PopoverTrigger>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <ToneBadge tone="amber">Not assigned</ToneBadge>
                          <span className="text-[13px] text-muted-foreground">
                            Best guess: {cur.guess}
                          </span>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              Choose
                              <ChevronDown className="text-muted-foreground" />
                            </Button>
                          </PopoverTrigger>
                        </>
                      )}
                    </span>
                  </PopoverAnchor>
                </div>
                <TypeMenu
                  current={typeNow}
                  exclude={cur.kind === "new" ? cur.name : undefined}
                  onPick={(name) => {
                    if (cur.kind === "new") {
                      finish("merged");
                      return;
                    }
                    setTypes((t) => ({ ...t, [cur.id]: name }));
                    setTypeMenu(false);
                  }}
                  onNew={() => {
                    setTypeMenu(false);
                    toast("Name a new request type", {
                      description: "It starts in Learn. Find it in Playbook.",
                    });
                  }}
                />
              </Popover>
            </div>

            {doneNow ? (
              <DoneBanner
                kind={doneNow}
                item={cur}
                reason={reason}
                onNext={() => goNext()}
              />
            ) : null}

            <div className="px-6 pt-4">
              <div className="w-0 min-w-full overflow-x-auto overflow-y-hidden scrollbar-none">
                <Tabs
                  value={sub}
                  onValueChange={(v) => setSub(v as Sub)}
                  className="min-w-0 max-w-full"
                >
                  <TabsList className="max-w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-none">
                    {SUBS[cur.kind].map((s) => (
                      <TabsTrigger
                        key={s.id}
                        value={s.id}
                        className="gap-2 px-3"
                      >
                        {s.label}
                        {s.id !== "main" ? (
                          <CountBadge
                            n={
                              s.id === "thread"
                                ? cur.emails.length
                                : cur.kind !== "new"
                                  ? cur.checks.length
                                  : 0
                            }
                          />
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4.5 px-6 pt-4 pb-5">
              {sub === "main" && cur.kind === "reply" ? (
                <ReplyMain
                  item={cur}
                  editing={editing}
                  done={doneNow}
                  draft={drafts[cur.id] ?? cur.edited}
                  onDraft={(v) => setDrafts((d) => ({ ...d, [cur.id]: v }))}
                />
              ) : null}
              {sub === "main" && cur.kind === "call" ? (
                <CallMain key={cur.id} item={cur} />
              ) : null}
              {sub === "main" && cur.kind === "new" ? (
                <NewMain
                  key={cur.id}
                  item={cur}
                  onMerge={() => finish("merged")}
                  done={!!doneNow}
                />
              ) : null}
              {sub === "thread" ? <Thread item={cur} /> : null}
              {sub === "checks" && cur.kind !== "new" ? (
                <Checks checks={cur.checks} />
              ) : null}
            </div>

            {!doneNow ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {cur.kind === "reply" && !editing ? (
                    <>
                      <Button onClick={() => finish("sent")}>Send reply</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(true);
                          setSub("main");
                          setTypeMenu(false);
                        }}
                      >
                        <Pencil />
                        Edit, then send
                      </Button>
                      <DangerButton onClick={() => setDialog("dont")}>
                        Don&apos;t send
                      </DangerButton>
                    </>
                  ) : null}
                  {cur.kind === "reply" && editing ? (
                    <>
                      <Button onClick={() => finish("edited")}>
                        Send edited reply
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : null}
                  {cur.kind === "call" ? (
                    <>
                      <Button onClick={() => finish("called")}>
                        <Phone />
                        Call back
                      </Button>
                      <Button variant="outline" onClick={() => finish("done")}>
                        Mark as done
                      </Button>
                      <DangerButton onClick={() => finish("nocall")}>
                        No call needed
                      </DangerButton>
                    </>
                  ) : null}
                  {cur.kind === "new" ? (
                    <>
                      <Button onClick={() => finish("named")}>
                        Name it and start Learn
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setTypeMenu(true)}
                      >
                        Same as an existing type
                      </Button>
                      <DangerButton onClick={() => finish("ignored")}>
                        Ignore this kind
                      </DangerButton>
                    </>
                  ) : null}
                </div>
                {cur.kind !== "new" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialog("rule")}
                  >
                    <Plus />
                    Make this a rule
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-10 text-center">
            <span className="inline-grid size-10 place-items-center rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              <Check className="size-5" />
            </span>
            <span className="mt-2 text-base font-medium">
              You&apos;re all caught up
            </span>
            <span className="text-muted-foreground">
              Nothing here needs a person right now.
            </span>
          </div>
        )}
      </Card>

      {cur && cur.kind === "reply" ? (
        <DontSendDialog
          key={`dont-${cur.id}`}
          open={dialog === "dont"}
          onOpenChange={(o) => setDialog(o ? "dont" : null)}
          item={cur}
          reason={reason}
          onReason={setReason}
          onConfirm={(saveRule) => {
            finish("notsent");
            if (saveRule)
              toast("Rule saved", {
                description: "Find it on the Playbook Rules tab.",
              });
          }}
        />
      ) : null}
      {cur && cur.kind !== "new" ? (
        <RuleDialog
          key={`rule-${cur.id}`}
          open={dialog === "rule"}
          onOpenChange={(o) => setDialog(o ? "rule" : null)}
          item={cur}
          onSave={() => {
            setDialog(null);
            toast("Rule saved", {
              description: `It applies to every ${cur.ruleType} email. Find it on the Playbook Rules tab.`,
            });
          }}
        />
      ) : null}
    </>
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <Badge
      variant="secondary"
      className="h-[18px] min-w-[18px] rounded-full px-1.5 text-[11px] tabular-nums"
    >
      {n}
    </Badge>
  );
}

function DangerButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-950"
    >
      {children}
    </Button>
  );
}

function ListRow({
  item: i,
  on,
  done,
  onPick,
}: {
  item: InboxItem;
  on: boolean;
  done?: DoneKind;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-current={on ? "true" : undefined}
      className={cn(
        "flex w-full flex-col items-start gap-1 border-b px-4 py-3.5 text-left transition-colors hover:bg-muted/60",
        on &&
          "bg-sky-50 hover:bg-sky-50 dark:bg-sky-950/50 dark:hover:bg-sky-950/50",
        done && "opacity-60",
      )}
    >
      <span className="flex w-full justify-between gap-2">
        <span className="font-semibold">
          {i.kind === "new" ? i.name : i.from}
        </span>
        {i.kind !== "new" ? (
          <span className="flex-none text-xs font-medium text-amber-700 dark:text-amber-400">
            {i.wait}
          </span>
        ) : null}
      </span>
      {i.kind !== "new" ? (
        <span className="flex items-center gap-1.5">
          {i.kind === "call" ? (
            <Phone
              className="size-3.5 text-muted-foreground"
              aria-label="Inbound call"
            />
          ) : null}
          {i.subject}
        </span>
      ) : null}
      <span className="text-[13px] text-muted-foreground">{i.line}</span>
      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
        {i.kind === "new" ? (
          <ToneBadge tone="amber">New request type</ToneBadge>
        ) : (
          <ToneBadge tone="muted">
            {i.kind === "reply" ? "Reply to approve" : "Call to return"}
          </ToneBadge>
        )}
        {done ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              DONE[done].ok
                ? "text-green-800 dark:text-green-400"
                : "text-muted-foreground",
            )}
          >
            <Check className="size-3.5" />
            {DONE[done].label}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function TypeMenu({
  current,
  exclude,
  onPick,
  onNew,
}: {
  current: string | null;
  exclude?: string;
  onPick: (name: string) => void;
  onNew: () => void;
}) {
  const [q, setQ] = useState("");
  const stages: Stage[] = ["Review", "Shadow", "Learn"];
  const match = (n: string) =>
    n !== exclude && n.toLowerCase().includes(q.trim().toLowerCase());
  return (
    <PopoverContent
      align="start"
      className="w-[360px] p-1"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div className="relative m-1 mb-1.5">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search request types"
          placeholder="Search request types"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-8 pl-8 text-[13px]"
        />
      </div>
      <div
        role="listbox"
        aria-label="Request types"
        className="flex max-h-[360px] flex-col overflow-y-auto"
      >
        {stages.map((s) => {
          const opts = INBOX_TYPES.filter(
            (t) => t.stage === s && match(t.name),
          );
          if (!opts.length) return null;
          return (
            <div key={s} className="flex flex-col">
              <span className="flex items-center gap-2 px-2.5 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                <i
                  className={cn("size-2 rounded-full border", STAGE_CLASS[s])}
                />
                {s}
              </span>
              {opts.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  role="option"
                  aria-selected={t.name === current}
                  onClick={() => onPick(t.name)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
                >
                  <span className="inline-grid w-4 place-items-center">
                    {t.name === current ? <Check className="size-3.5" /> : null}
                  </span>
                  {t.name}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-1 border-t pt-1">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
        >
          <span className="inline-grid w-4 place-items-center">
            <Plus className="size-3.5" />
          </span>
          Name a new request type
        </button>
      </div>
    </PopoverContent>
  );
}

function DoneBanner({
  kind,
  item,
  reason,
  onNext,
}: {
  kind: DoneKind;
  item: InboxItem;
  reason: string;
  onNext: () => void;
}) {
  const d = DONE[kind];
  let text: React.ReactNode = d.text;
  if ((kind === "sent" || kind === "edited") && item.kind !== "new")
    text = `${d.text}${item.addr}.`;
  if (kind === "notsent") text = `${d.text}Reason: ${reason}.`;
  if (kind === "named")
    text = (
      <>
        Named. It is now in{" "}
        <Link
          href="/playbook?stage=Learn"
          className="underline underline-offset-2"
        >
          Playbook under Learn
        </Link>
        .
      </>
    );
  return (
    <div
      className={cn(
        "mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-3",
        d.ok
          ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
          : "border-border bg-muted/50 text-zinc-600 dark:text-zinc-300",
      )}
      role="status"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Check className="size-4 flex-none" />
        <span>{text}</span>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        className="flex-none text-foreground"
      >
        Next item
        <ChevronRight />
      </Button>
    </div>
  );
}

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function Quote({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "amber";
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border px-3.5 py-3",
        tone === "muted"
          ? "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          : STAGE_CLASS.Review,
      )}
    >
      {children}
    </div>
  );
}

function ReplyMain({
  item,
  editing,
  done,
  draft,
  onDraft,
}: {
  item: ReplyItem;
  editing: boolean;
  done?: DoneKind;
  draft: string;
  onDraft: (v: string) => void;
}) {
  const label = editing
    ? "Editing the reply"
    : done === "edited"
      ? "Your edited reply"
      : "The Operator's suggested reply";
  return (
    <>
      <Field label="What they asked">
        <Quote>{item.asked}</Quote>
      </Field>
      <Field
        label={label}
        aside={
          <span className="text-xs text-muted-foreground">To {item.addr}</span>
        }
      >
        {editing ? (
          <>
            <Textarea
              aria-label="Edit the reply"
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              autoFocus
              className="min-h-[220px] rounded-[10px] px-4.5 py-4 text-sm leading-relaxed md:text-sm"
            />
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Pencil className="size-3.5" />
              <span>
                The changes you make are saved as a correction, so the Operator
                learns from them. You&apos;ll see it in{" "}
                <Link href="/training" className="underline underline-offset-2">
                  Training
                </Link>
                .
              </span>
            </span>
          </>
        ) : (
          <div className="rounded-[10px] border px-4.5 py-4 leading-relaxed whitespace-pre-line">
            {done === "edited" ? draft : item.reply}
          </div>
        )}
        {item.also ? (
          <span className="inline-flex items-center gap-1.5 text-[13px]">
            <Sparkles className="size-3.5 flex-none text-muted-foreground" />
            <span>
              <span className="font-medium">Also: </span>
              {item.also}
            </span>
          </span>
        ) : null}
      </Field>
      <div className="flex flex-col gap-1.5 rounded-[10px] border px-3.5 py-3">
        <span className="font-medium">Why this reply</span>
        <span className="text-muted-foreground">{item.why}</span>
        {item.ruleUsed ? (
          <span className="text-[13px]">
            Rule used:{" "}
            <Link
              href="/playbook?tab=rules"
              className="text-primary underline-offset-2 hover:underline"
            >
              {item.ruleUsed}
            </Link>
          </span>
        ) : null}
      </div>
    </>
  );
}

function CallMain({ item }: { item: Extract<InboxItem, { kind: "call" }> }) {
  const [playing, setPlaying] = useState(false);
  return (
    <>
      <Field label="What the caller wanted">
        <Quote>{item.asked}</Quote>
      </Field>
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
        <Button
          size="icon"
          className="size-8 rounded-full"
          aria-label={playing ? "Pause recording" : "Play recording"}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5" />
          )}
        </Button>
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-[13px] font-medium">Call recording</span>
          <span className="h-1 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "block h-full bg-primary transition-[width] duration-1000",
                playing ? "w-1/3" : "w-0",
              )}
            />
          </span>
        </div>
        <span className="text-[13px] text-muted-foreground tabular-nums">
          1:18
        </span>
      </div>
      <Field label="Suggested next step">
        <div className="flex flex-col gap-1.5 rounded-[10px] border px-4.5 py-4">
          <span className="font-medium">{item.stepTitle}</span>
          <span>{item.step}</span>
        </div>
      </Field>
    </>
  );
}

function NewMain({
  item,
  onMerge,
  done,
}: {
  item: Extract<InboxItem, { kind: "new" }>;
  onMerge: () => void;
  done: boolean;
}) {
  const [name, setName] = useState(item.name);
  const [desc, setDesc] = useState(item.desc);
  return (
    <>
      <Field label="What the Operator found">
        <Quote tone="amber">{item.found}</Quote>
      </Field>
      <Field label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Name"
          disabled={done}
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          aria-label="Description"
          disabled={done}
          className="min-h-16"
        />
      </Field>
      <Field label="What it would do">
        <span>{item.would}</span>
      </Field>
      {item.similar ? (
        <div className="flex items-center justify-between gap-3 rounded-[10px] border px-3.5 py-3">
          <span>
            <span className="font-medium">Looks a lot like </span>
            {item.similar}. Merge them if they are the same thing.
          </span>
          {!done ? (
            <Button variant="outline" size="sm" onClick={onMerge}>
              Merge
            </Button>
          ) : null}
        </div>
      ) : null}
      <span className="text-[13px] text-muted-foreground">
        After you name it, it starts in Learn. Nothing is sent for this kind of
        email until you move it up.
      </span>
    </>
  );
}

function Thread({ item }: { item: InboxItem }) {
  return (
    <div className="flex flex-col gap-2.5">
      {item.emails.map((e, n) => (
        <div
          key={n}
          className="flex flex-col gap-2.5 rounded-xl border px-4 py-3.5"
        >
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                "inline-grid size-7 flex-none place-items-center rounded-full text-[11px] font-semibold text-gray-700 dark:text-gray-200",
                e.team ? "bg-sky-100 dark:bg-sky-950" : AVATAR[n % 4],
              )}
            >
              {initials(e.who)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-snug">
              <span className="flex items-center gap-1.5 font-medium">
                {e.who}
                {e.team ? <ToneBadge tone="blue">Your team</ToneBadge> : null}
              </span>
              <span className="text-xs text-muted-foreground">
                From {e.addr} · To {e.to}
              </span>
              {e.subject && (n === 0 || item.kind === "new") ? (
                <span className="text-xs text-muted-foreground">
                  Subject: {e.subject}
                </span>
              ) : null}
            </span>
            <span className="flex-none text-xs text-muted-foreground">
              {e.time}
            </span>
          </div>
          <div className="leading-normal whitespace-pre-line">{e.body}</div>
          {e.file ? (
            <Badge variant="secondary" className="self-start">
              {e.file}
            </Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Checks({ checks }: { checks: { title: string; detail: string }[] }) {
  return (
    <div className="rounded-xl border px-4 py-1">
      {checks.map((c, n) => (
        <div
          key={n}
          className="flex items-start gap-3 border-b border-zinc-100 py-3 last:border-b-0 dark:border-zinc-800"
        >
          <span className="inline-grid size-6 flex-none place-items-center rounded-full bg-muted text-xs font-medium tabular-nums">
            {n + 1}
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="font-medium">{c.title}</span>
            <span className="text-[13px] text-muted-foreground">
              {c.detail}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
