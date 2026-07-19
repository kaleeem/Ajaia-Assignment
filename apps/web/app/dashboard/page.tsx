import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DocumentList } from "@/components/dashboard/document-list";
import { mockDocuments } from "@/lib/mock-documents";

/**
 * Dashboard page — server component.
 * Replace `mockDocuments` with a real data fetch (e.g. Supabase) later.
 */
export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-6 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <DashboardHeader />
          <DocumentList documents={mockDocuments} />
        </div>
      </main>
    </div>
  );
}
