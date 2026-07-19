import { EditorShell } from "@/components/document/editor-shell";
import { mockDocuments } from "@/lib/mock-documents";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Document editor page — server component.
 * Finds mock document by ID to pass initial title.
 * Replace mock lookup with a real DB fetch later.
 */
export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const doc = mockDocuments.find((d) => d.id === id);
  const initialTitle = doc?.title ?? "Untitled Document";

  return <EditorShell documentId={id} initialTitle={initialTitle} />;
}

