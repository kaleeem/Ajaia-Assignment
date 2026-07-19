/**
 * Client-side conversion of imported plain text / markdown into valid Tiptap
 * JSON. No full markdown parser — we split on blank lines into paragraphs and
 * treat leading "#" runs as headings. Good enough for the assessment import.
 */

export function textToTiptapContent(raw: string): unknown {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();

  if (!text) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const blocks = text.split(/\n{2,}/);
  const content = blocks.map((block) => {
    const lines = block.split("\n");
    const first = lines[0] ?? "";

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(first);
    if (headingMatch) {
      const level = Math.min(6, headingMatch[1].length);
      const rest = lines.slice(headingMatch[0] === first ? 1 : 0).join("\n").trim();
      const text2 = headingMatch[2] + (rest ? `\n${rest}` : "");
      return {
        type: "heading",
        attrs: { level },
        content: [{ type: "text", text }],
      };
    }

    return {
      type: "paragraph",
      content: [{ type: "text", text: block.trim() }],
    };
  });

  return { type: "doc", content };
}

/** Derives a document title from an imported filename (strips extension). */
export function filenameToTitle(filename: string): string {
  return filename.replace(/\.(txt|md|markdown)$/i, "").trim() || "Untitled Document";
}

const ALLOWED_EXTENSIONS = [".txt", ".md", ".markdown"];

export function isSupportedImportFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
