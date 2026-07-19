"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Users, User, Import, ChevronsUpDown, Check, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { MOCK_USERS } from "@/lib/users";
import { createDocument } from "@/lib/documents-client";
import { filenameToTitle, isSupportedImportFile, textToTiptapContent } from "@/lib/import";

const navItems = [
  { label: "All Documents", href: "/dashboard", icon: FileText },
  { label: "Owned by me", href: "/dashboard?filter=owned", icon: User },
  { label: "Shared with me", href: "/dashboard?filter=shared", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userId, setCurrentUser, hydrated } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSwitchUser = (id: string) => {
    setCurrentUser(id);
    // Re-run the server dashboard so it reads the updated current-user cookie.
    router.refresh();
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
          type="button"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-60"
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
        <p className="px-3 pt-1 text-xs text-muted-foreground">Supported files: .txt, .md</p>
      </nav>

      {/* User / Profile + mock user switcher */}
      <div className="border-t border-border p-3">
        <div className="px-1 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Switch user
        </div>
        <div className="flex flex-col gap-1">
          {MOCK_USERS.map((u) => {
            const active = hydrated && u.id === userId;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSwitchUser(u.id)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {u.name}
                  </span>
                  <span className="block truncate text-xs">{u.email}</span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
        {hydrated && (
          <p className="mt-2 truncate px-1 text-xs text-muted-foreground">
            Signed in as <span className="font-medium">{user.name}</span> (mock)
          </p>
        )}
      </div>
    </aside>
  );
}
