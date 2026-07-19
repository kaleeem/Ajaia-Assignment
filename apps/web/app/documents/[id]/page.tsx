import { EditorShell } from "@/components/document/editor-shell";
import { getDocument } from "@/lib/documents";
import { emptyEditorContent } from "@/lib/content";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Document editor page — server component.
 * Loads the real document from Supabase by id and passes the initial
 * title + Tiptap JSON content + owner to the editor shell.
 */
export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;

  let initialTitle = "Untitled Document";
  let initialContent = emptyEditorContent;
  let ownerId: string | null = null;

  try {
    const doc = await getDocument(id);
    if (doc) {
      initialTitle = doc.title;
      ownerId = doc.owner_id;
      if (doc.content) initialContent = doc.content as typeof emptyEditorContent;
    }
  } catch {
    // Keep defaults; editor shell handles save failures gracefully.
  }

  return (
    <EditorShell
      documentId={id}
      initialTitle={initialTitle}
      initialContent={initialContent}
      ownerId={ownerId}
    />
  );
}
