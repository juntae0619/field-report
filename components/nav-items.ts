import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageSquare,
  StickyNote,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/schedules", label: "임장 일정", icon: CalendarDays },
  { href: "/reports", label: "임장보고서", icon: FileText },
  { href: "/properties", label: "임장 희망 물건", icon: Building2 },
  { href: "/board", label: "게시판", icon: MessageSquare },
  { href: "/memos", label: "내 메모", icon: StickyNote },
  { href: "/account", label: "내 계정", icon: UserCog },
  { href: "/members", label: "조원 관리", icon: Users, adminOnly: true },
];
