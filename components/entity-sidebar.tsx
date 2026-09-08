"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  Mail,
  Factory,
  Users,
  Truck,
  FileBarChart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Emails", href: "/emails", icon: Mail },
  { label: "Manufacturers", href: "/manufacturers", icon: Factory },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Orders", href: "/orders", icon: Truck },
  { label: "Reports", href: "/reports", icon: FileBarChart },
];

export function EntitySidebar({ slug, entityName }: { slug: string; entityName: string }) {
  const pathname = usePathname();
  const base = `/${slug}`;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-white dark:bg-neutral-900">
      <div className="px-4 py-4">
        <Link href="/" className="text-xs text-muted-foreground hover:underline">
          ← PeakCorp
        </Link>
        <p className="mt-1 truncate text-sm font-semibold">{entityName}</p>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV.map((item) => {
          const href = `${base}${item.href}`;
          const isActive = item.href === "" ? pathname === base : pathname.startsWith(href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-neutral-100 font-medium text-foreground dark:bg-neutral-800"
                  : "text-muted-foreground hover:bg-neutral-50 hover:text-foreground dark:hover:bg-neutral-800/50",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pb-4">
        <Link
          href={`${base}/settings/email`}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
            pathname.startsWith(`${base}/settings`)
              ? "bg-neutral-100 font-medium text-foreground dark:bg-neutral-800"
              : "text-muted-foreground hover:bg-neutral-50 hover:text-foreground dark:hover:bg-neutral-800/50",
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
