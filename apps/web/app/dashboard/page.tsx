import { cookies } from "next/headers";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DocumentList } from "@/components/dashboard/document-list";
import { listOwnedDocuments, listSharedDocuments } from "@/lib/documents";
import { DEFAULT_USER_ID, CURRENT_USER_STORAGE_KEY } from "@/lib/users";
import type { Document } from "@/lib/types";

type Filter = "all" | "owned" | "shared";

/**
 * Dashboard page — server component.
 * Loads real documents for the current mock user: owned docs + docs shared
 * with them (via `document_shares`). Honors the `?filter=` nav param.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const cookieStore = await cookies();
  const currentUserId =
    cookieStore.get(CURRENT_USER_STORAGE_KEY)?.value ?? DEFAULT_USER_ID;

  const { filter } = await searchParams;
  const activeFilter: Filter =
    filter === "owned" || filter === "shared" ? filter : "all";

  let documents: Document[] = [];
  try {
    const [owned, shared] = await Promise.all([
      listOwnedDocuments(currentUserId),
      listSharedDocuments(currentUserId),
    ]);
    documents = [...owned, ...shared];
  } catch {
    documents = [];
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-6 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <DashboardHeader />
          <DocumentList
            documents={documents}
            currentUserId={currentUserId}
            filter={activeFilter}
          />
        </div>
      </main>
    </div>
  );
}
