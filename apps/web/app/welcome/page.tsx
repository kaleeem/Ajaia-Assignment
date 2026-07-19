"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { MOCK_USERS } from "@/lib/users";

export default function WelcomePage() {
  const router = useRouter();
  const { setCurrentUser } = useCurrentUser();

  const handleSelect = (id: string) => {
    setCurrentUser(id);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold select-none shadow-sm"
            aria-hidden
          >
            A
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Ajaia Docs
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Collaborative documents, simplified.
            </p>
          </div>
        </div>

        {/* Account selection */}
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Choose a demo account to enter the workspace
          </p>

          <div className="flex flex-col gap-2">
            {MOCK_USERS.map((u) => {
              const initials = u.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={u.id}
                  id={`select-user-${u.id}`}
                  type="button"
                  onClick={() => handleSelect(u.id)}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Avatar */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold select-none">
                    {initials}
                  </span>

                  {/* Name + email */}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {u.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {u.email}
                    </span>
                  </span>

                  {/* Arrow */}
                  <span className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 text-xs">
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo notice */}
        <p className="text-center text-xs text-muted-foreground">
          This is a demonstration workspace.{" "}
          <span className="font-medium">No passwords required.</span>
        </p>
      </div>
    </div>
  );
}
