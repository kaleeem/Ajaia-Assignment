import { DocumentCard } from "./document-card";
import type { Document } from "@/lib/types";

interface DocumentListProps {
  documents: Document[];
  currentUserId: string;
  filter?: "all" | "owned" | "shared";
}

export function DocumentList({
  documents,
  currentUserId,
  filter = "all",
}: DocumentListProps) {
  const owned = documents.filter((d) => (d.ownerId ?? "") === currentUserId);
  const shared = documents.filter((d) => (d.ownerId ?? "") !== currentUserId);

  const visibleOwned = filter === "shared" ? [] : owned;
  const visibleShared = filter === "owned" ? [] : shared;

  const hasOwned = visibleOwned.length > 0;
  const hasShared = visibleShared.length > 0;

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

  if (!hasOwned && !hasShared) {
    const message =
      filter === "owned"
        ? "No owned documents yet."
        : filter === "shared"
          ? "No documents have been shared with you."
          : "No documents to show.";
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hasOwned && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {filter === "owned" ? "Owned by Me" : "My Documents"}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleOwned.map((doc) => (
              <DocumentCard key={doc.id} document={doc} currentUserId={currentUserId} />
            ))}
          </div>
        </section>
      )}

      {hasShared && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Shared with Me
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleShared.map((doc) => (
              <DocumentCard key={doc.id} document={doc} currentUserId={currentUserId} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
