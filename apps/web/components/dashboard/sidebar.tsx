"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, Users, User, Upload, LogOut } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CURRENT_USER_STORAGE_KEY } from "@/lib/users";
import { createDocument } from "@/lib/documents-client";
import { filenameToTitle, isSupportedImportFile, textToTiptapContent } from "@/lib/import";

const navItems = [
  { label: "All Documents", href: "/dashboard", icon: FileText, filter: null },
  { label: "Owned by me", href: "/dashboard?filter=owned", icon: User, filter: "owned" },
  { label: "Shared with me", href: "/dashboard?filter=shared", icon: Users, filter: "shared" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // useSearchParams gives the router-driven search params — accurate and
  // flicker-free compared to window.location.search (which lags behind).
  const searchParams = useSearchParams();
  const { user, userId, hydrated } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
    document.cookie = `${CURRENT_USER_STORAGE_KEY}=; path=/; max-age=0; samesite=lax`;
    setProfileMenuOpen(false);
    router.push("/welcome");
  };

  const handleImportFile = async (file: File) => {
    if (!isSupportedImportFile(file.name)) {
      toast.error("Unsupported file. Supported files: .txt, .md");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const content = textToTiptapContent(text);
      const doc = await createDocument(userId, filenameToTitle(file.name), content);
      toast.success(`Imported "${file.name}"`);
      router.push(`/documents/${doc.id}`);
    } catch {
      toast.error("Failed to import file. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const currentFilter = searchParams.get("filter"); // null | "owned" | "shared"

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background">
      {/* Logo / Wordmark */}
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold select-none">
          A
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">
          Ajaia Docs
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ label, href, icon: Icon, filter }) => {
          // Derive active state from router-driven searchParams (no flicker).
          const isActive =
            pathname === "/dashboard" &&
            (filter === null ? currentFilter === null : currentFilter === filter);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                // Remove transition-colors to eliminate hover flicker during navigation.
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
          id="import-file-btn"
          type="button"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          <Upload className="h-4 w-4 shrink-0" />
          {importing ? "Importing…" : "Import"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = "";
          }}
        />
        <p className="px-3 pt-1 text-xs text-muted-foreground">
          Supported: .txt, .md
        </p>
      </nav>

      {/* Profile area — current user only */}
      {hydrated && (
        <div className="border-t border-border p-3 relative">
          <button
            id="profile-menu-btn"
            type="button"
            onClick={() => setProfileMenuOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent group"
            aria-haspopup="true"
            aria-expanded={profileMenuOpen}
          >
            {/* Avatar */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold select-none">
              {initials}
            </span>
            {/* Name + email */}
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </span>
            {/* Chevron */}
            <span className="text-muted-foreground text-xs opacity-60 group-hover:opacity-100">
              ⌃
            </span>
          </button>

          {/* Profile popover */}
          {profileMenuOpen && (
            <div className="absolute bottom-[calc(100%-0.5rem)] left-3 right-3 mb-1 rounded-md border border-border bg-popover shadow-md z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs text-muted-foreground">Demo account</p>
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              </div>
              <button
                id="sign-out-btn"
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
