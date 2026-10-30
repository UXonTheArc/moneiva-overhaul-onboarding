"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  BarChart3,
  Bot,
  ChevronsUpDown,
  FileText,
  GraduationCap,
  Home,
  Inbox,
  KeyRound,
  Settings,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { inboxItems } from "@/lib/moneiva/inbox-data"

type NavItem = { title: string; icon: LucideIcon; href?: string; badge?: string }
type NavGroup = { label: string; items: NavItem[] }

// Proposed nav (Jake, Oct 16). Management items are in the nav only; their screens are not part of this mockup.
const NAV: NavGroup[] = [
  {
    label: "Work",
    items: [
      { title: "Home", icon: Home, href: "/" },
      { title: "Inbox", icon: Inbox, href: "/inbox", badge: String(inboxItems.length) },
      { title: "Activity", icon: Activity, href: "/activity" },
    ],
  },
  {
    label: "Teach",
    items: [
      { title: "Playbook", icon: FileText, href: "/playbook" },
      { title: "Training", icon: GraduationCap, href: "/training" },
    ],
  },
  {
    label: "Build",
    items: [
      { title: "Agents", icon: Bot, href: "/agents" },
      { title: "Workflows", icon: Workflow, href: "/workflows" },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Credentials", icon: KeyRound },
      { title: "Users", icon: Users },
      { title: "Settings", icon: Settings },
      { title: "KPI Charts", icon: BarChart3 },
    ],
  },
]

function isActive(pathname: string, href?: string) {
  if (!href) return false
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex justify-center px-2 pt-2 pb-3 group-data-[collapsible=icon]:hidden">
          <Image src="/moneiva-logo.png" alt="Moneiva" width={128} height={32} className="h-auto w-32" priority />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.href ? (
                    <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton tooltip={`${item.title} (not in this mockup)`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                  {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-xs font-semibold text-gray-600">
                TM
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[13px] font-medium">Taylor Morgan</span>
                <span className="truncate text-[11px] text-muted-foreground">taylor@example.test</span>
              </span>
              <ChevronsUpDown className="ml-auto text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
