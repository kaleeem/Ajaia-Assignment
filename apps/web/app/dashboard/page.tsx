import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DocumentList } from "@/components/dashboard/document-list";
import { listOwnedDocuments, listSharedDocuments } from "@/lib/documents";
import { CURRENT_USER_STORAGE_KEY, MOCK_USERS } from "@/lib/users";
import type { Document } from "@/lib/types";

type Filter = "all" | "owned" | "shared";

/**
 * Dashboard page content — server component.
 * Renders the dashboard header and the document grid inside DashboardLayout.
 * Reads real documents for the current mock user and filters them accordingly.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const cookieStore = await cookies();
  const storedId = cookieStore.get(CURRENT_USER_STORAGE_KEY)?.value;
  const isValid = storedId && MOCK_USERS.some((u) => u.id === storedId);

  if (!isValid) {
    redirect("/welcome");
  }

  const currentUserId = storedId as string;

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
    <div className="flex flex-col gap-6 p-6 sm:p-8 max-w-5xl w-full mx-auto">
      <DashboardHeader />
      <DocumentList
        documents={documents}
        currentUserId={currentUserId}
        filter={activeFilter}
      />
    </div>
  );
}
