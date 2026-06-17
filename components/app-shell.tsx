"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/nav-items";
import { COHORT_LABEL, ROLE_LABEL, type Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function NavLinks({
  profile,
  onNavigate,
}: {
  profile: Profile;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || profile.role === "admin"
  );

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-medium transition-all",
              active
                ? "bg-sidebar-active text-white shadow-sm"
                : "text-sidebar-text hover:bg-black/5"
            )}
          >
            <item.icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-white" : "text-sidebar-icon"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({
  profile,
  logoutAction,
}: {
  profile: Profile;
  logoutAction: () => Promise<void>;
}) {
  const initials = profile.name?.slice(0, 1) || "U";
  const roleLabel = [
    ROLE_LABEL[profile.role],
    profile.cohort ? COHORT_LABEL[profile.cohort] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="border-t border-sidebar-border-warm px-3 py-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-body-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-semibold text-sidebar-brand">
            {profile.name}
          </p>
          <p className="truncate text-caption text-sidebar-muted">
            {roleLabel}
          </p>
        </div>
      </div>
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-center gap-2 rounded-xl text-sidebar-muted hover:bg-black/5 hover:text-sidebar-text"
        >
          <LogOut className="size-4" />
          로그아웃
        </Button>
      </form>
    </div>
  );
}

function SidebarBrand() {
  return (
    <Link
      href="/dashboard"
      className="flex flex-col items-center gap-2 px-5 pt-6 pb-4 transition-opacity hover:opacity-80"
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-sidebar-active text-white shadow-sm">
        <Building2 className="size-6" />
      </div>
      <span className="font-heading text-sm font-extrabold uppercase tracking-[0.12em] text-sidebar-brand">
        임장 스터디
      </span>
    </Link>
  );
}

export function AppShell({
  profile,
  logoutAction,
  children,
}: {
  profile: Profile;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-hint-of-sky">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-[230px] shrink-0 flex-col bg-sidebar-warm md:flex">
        <SidebarBrand />
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks profile={profile} />
        </div>
        <UserCard profile={profile} logoutAction={logoutAction} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 모바일 헤더 */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ash-gray bg-hint-of-sky px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex h-full w-[230px] flex-col border-none bg-sidebar-warm p-0"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <SidebarBrand />
              <div className="flex flex-1 flex-col overflow-y-auto py-3">
                <NavLinks
                  profile={profile}
                  onNavigate={() => setOpen(false)}
                />
              </div>
              <div className="mt-auto">
                <UserCard profile={profile} logoutAction={logoutAction} />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-heading text-sm font-bold text-sidebar-brand">
            임장 스터디
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
