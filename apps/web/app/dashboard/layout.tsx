import { Suspense } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CURRENT_USER_STORAGE_KEY, MOCK_USERS } from "@/lib/users";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const storedId = cookieStore.get(CURRENT_USER_STORAGE_KEY)?.value;
  const isValid = storedId && MOCK_USERS.some((u) => u.id === storedId);

  if (!isValid) {
    redirect("/welcome");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Suspense required: Sidebar uses useSearchParams() */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
      <main className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background shrink-0">
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-border">
        <div className="h-7 w-7 rounded-md bg-primary/20" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
    </aside>
  );
}
