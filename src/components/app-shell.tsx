"use client";
// Comun — layout-ul aplicatiei: sidebar diferit pentru Miri (COUPLE) si Furnizori (VENDOR)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Grid3x3,
  Heart,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  UserCog,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/lib/constants";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavSection = { title: string; items: NavItem[] };

const NAV: Record<Role, NavSection[]> = {
  COUPLE: [
    {
      title: "Planificare",
      items: [
        { href: "/couple/dashboard", label: "Prezentare & buget", icon: LayoutDashboard }, // Persoana 2
        { href: "/couple/guests", label: "Invitați", icon: Users }, // Persoana 2
        { href: "/couple/floorplan", label: "Plan sală", icon: Grid3x3 }, // Persoana 3
        { href: "/couple/catering", label: "Catering & export", icon: UtensilsCrossed }, // Persoana 2
      ],
    },
    {
      title: "Furnizori",
      items: [
        { href: "/marketplace", label: "Marketplace", icon: Store }, // Persoana 1
        { href: "/couple/bookings", label: "Rezervările mele", icon: ClipboardList }, // Persoana 1
      ],
    },
  ],
  VENDOR: [
    {
      title: "Afacerea mea",
      items: [
        { href: "/vendor/dashboard", label: "Cereri rezervare", icon: Inbox }, // Persoana 1
        { href: "/vendor/calendar", label: "Calendar", icon: CalendarDays }, // Persoana 3
        { href: "/vendor/profile", label: "Profil & prețuri", icon: UserCog }, // Persoana 1
      ],
    },
    {
      title: "Explorează",
      items: [{ href: "/marketplace", label: "Marketplace", icon: Store }], // Persoana 1
    },
  ],
};

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_6px_rgb(185_18_74/0.35)]">
        <Heart className="size-4 fill-white" strokeWidth={2.5} />
      </span>
      <span className={cn("font-display text-[21px] font-semibold tracking-tight", light ? "text-white" : "text-ink")}>
        WedCraft
      </span>
    </Link>
  );
}

export function AppShell({
  role,
  userName,
  subtitle,
  children,
}: {
  role: Role;
  userName: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sections = NAV[role];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pt-2">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {section.title}
            </p>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active ? "bg-white text-ink shadow-[var(--shadow-card)] ring-1 ring-sand-200" : "text-slate-600 hover:bg-white/70 hover:text-ink",
                    )}
                  >
                    {active && <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />}
                    <Icon
                      className={cn("size-[18px] transition", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")}
                      strokeWidth={active ? 2.25 : 2}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t border-sand-200 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-violet-100 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/60">
            {initials(userName.replace("&", " ")) || "W"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{userName}</p>
            {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Deconectare"
            aria-label="Deconectare"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-brand-600"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-sand-50">
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-sand-200 bg-sand-100/60 lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sand-50 shadow-[var(--shadow-float)] animate-fade-in">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-sand-200 bg-white/80 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 hover:bg-sand-100" aria-label="Meniu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Logo />
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
