"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users, User, Import, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "All Documents", href: "/dashboard", icon: FileText },
  { label: "Owned by me", href: "/dashboard?filter=owned", icon: User },
  { label: "Shared with me", href: "/dashboard?filter=shared", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background">
      {/* Logo / Wordmark */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold select-none">
          A
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">
          Ajaia Docs
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href === "/dashboard" && pathname === "/dashboard");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-border" />

        {/* Import action */}
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => {
            // Import behavior to be implemented later
          }}
        >
          <Import className="h-4 w-4 shrink-0" />
          Import
        </button>
      </nav>

      {/* User / Profile area */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
            YO
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Your Name</p>
            <p className="truncate text-xs text-muted-foreground">you@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
