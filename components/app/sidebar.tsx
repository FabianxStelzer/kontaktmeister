"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, Megaphone, Settings, Home } from "lucide-react";
import type { WorkspaceRole } from "@prisma/client";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app/dashboard", label: "Dashboard", icon: Home },
  { href: "/app/contacts", label: "Kontakte", icon: Users },
  { href: "/app/campaigns", label: "Kampagnen", icon: Megaphone },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/settings", label: "Einstellungen", icon: Settings },
];

export function Sidebar({ role: _role }: { role: WorkspaceRole }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
            K
          </div>
          <span className="font-semibold">Kontaktmeister</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        <div>v0.1.0</div>
      </div>
    </aside>
  );
}
