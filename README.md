# Moneiva Overhaul V3

## Moneiva mockup

The third version of the Moneiva redesign: the [Overhaul](https://github.com/UXonTheArc/moneiva-overhaul), updated after Moneiva's feedback. The smaller "Cleanup" version is in [moneiva-cleanup](https://github.com/UXonTheArc/moneiva-cleanup). All names, emails and phone numbers are made up.

What changed from the Overhaul:

- **Email import lives in Training.** Past email is what Training runs on, so importing it (and seeing what was imported) moved there from Playbook > Documents.
- **Documents show what was learned.** Open any document to see each fact it taught the Operator, and mark it right or remove it. Uploading a file ends with a prompt to review its facts.
- **Training has empty and reading states.** `/training?state=empty` before any email is imported, `/training?state=reading` while the first import runs.
- **Workflows have their own page.** Build now has Agents and Workflows. A workflow can hand work between agents, use one, or run with no agent at all. Each agent still lists the workflows it is part of.

Run `npm install`, then `npm run dev`, and open http://localhost:3000.

| Nav group | Screens |
| --- | --- |
| Work | Home `/`, Inbox `/inbox`, Activity `/activity` |
| Teach | Playbook `/playbook`, Training `/training` |
| Build | Agents `/agents`, one agent `/agents/op` (also `phone`, `check`, `osd`, `cat`), Workflows `/workflows`, Damage report follow-up `/workflows/damage-report` |
| Management | Credentials, Users, Settings, KPI Charts (in the nav only, no screens yet) |

Most states can be linked to directly, for example `/inbox?item=c1`, `/activity?item=r1`, `/playbook?tab=rules`, `/playbook?tab=documents&doc=Northwind routing guide.pdf`, `/training?tab=shadow`, `/agents/op?tab=flow` and `/workflows/damage-report?tab=runs`. Nothing is saved; a reload resets every screen.

Code lives in `src/app` (routes), `src/components/moneiva` (screens) and `src/lib/moneiva` (mock data).

A fresh Next.js starter with TypeScript, Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com), plus a light/dark/system theme toggle.

## Stack

- Next.js 16 (App Router, `src/` directory, Turbopack)
- React 19, TypeScript
- Tailwind CSS v4 with `tw-animate-css`
- shadcn/ui, New York style, neutral base color, CSS variables (`src/app/globals.css`)
- `next-themes` for dark mode, `sonner` for toasts, `lucide-react` icons

Included components (in `src/components/ui`): badge, button, card, dialog, dropdown-menu, input, label, separator, sonner.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page (`src/app/page.tsx`) shows every included component in use.

## Adding components

```bash
npx shadcn@latest add tabs table sheet
```

Components land in `src/components/ui` and import `cn` from `@/lib/utils`.

## Theming

Colors, radius and chart/sidebar tokens are CSS variables in `src/app/globals.css` (`:root` for light, `.dark` for dark). Change them there, or paste a theme from [ui.shadcn.com/themes](https://ui.shadcn.com/themes).

The theme toggle lives in `src/components/mode-toggle.tsx` and the provider in `src/components/theme-provider.tsx`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
