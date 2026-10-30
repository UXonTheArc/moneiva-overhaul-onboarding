const STATS = [
  { big: "47 hours", label: "given back to your team", sub: "About $1,880 at $40 an hour" },
  { big: "467", label: "customer requests handled", sub: "159 emails, 198 calls in, 110 calls out" },
  { big: "38", label: "after-hours calls answered", sub: "No one had to be on call" },
  { big: "7", label: "problems caught early", sub: "Late loads and closing docks, before customers asked" },
  { big: "Under 1 min", label: "to answer a call", sub: "Every call picked up on the first ring" },
]

const RECENT = [
  { text: "Saw that Fabrikam Foods closes its dock at 3 PM and moved pickup 9800123 up to 1 PM.", when: "Tuesday" },
  { text: "Called 12 carriers about late loads and updated every ETA before a customer asked.", when: "Yesterday" },
  { text: "Answered a Saturday call from Contoso Retail and texted them the pickup status in 2 minutes.", when: "Oct 8" },
]

/** Why people use the app: what the agents got done for the team. */
export function Wins() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-green-200 bg-gradient-to-b from-green-50 to-background p-5 dark:border-green-900 dark:from-green-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-medium">What your agents did for you</h2>
          <span className="text-muted-foreground">Last 30 days. Up 18% from the 30 days before.</span>
        </div>
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
          Since Sep 16: 112 hours saved
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 rounded-lg border border-green-200 bg-background px-4 py-3.5 dark:border-green-900">
            <span className="text-[26px] font-semibold tracking-tight text-green-800 dark:text-green-300">{s.big}</span>
            <span className="text-sm font-medium">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.sub}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Recent wins</span>
        <ul className="flex flex-col gap-1.5">
          {RECENT.map((r) => (
            <li key={r.text} className="flex items-baseline gap-2.5 text-sm">
              <i className="size-2 flex-none translate-y-[-1px] rounded-full bg-green-600" aria-hidden />
              <span className="min-w-0 flex-1">{r.text}</span>
              <span className="flex-none text-xs text-muted-foreground">{r.when}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
