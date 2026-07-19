import { DocumentCard } from "./document-card";
import type { Document } from "@/lib/types";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const owned = documents.filter((d) => d.ownership === "owned");
  const shared = documents.filter((d) => d.ownership === "shared");

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">No documents yet.</p>
        <p className="text-muted-foreground text-xs mt-1">
          Create your first document using the + New Document button above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {owned.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            My Documents
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {owned.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </section>
      )}

      {shared.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Shared with Me
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shared.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
