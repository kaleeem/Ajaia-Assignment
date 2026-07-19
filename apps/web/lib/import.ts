/**
 * Client-side conversion of imported plain text / markdown into valid Tiptap
 * JSON. Handles headings, paragraphs, bullet lists, ordered lists, and basic
 * inline marks (bold, italic, code, links). Complex Markdown such as images
 * and HTML badges degrades gracefully to readable plain text.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface TextNode {
  type: "text";
  text: string;
  marks?: Mark[];
}

interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
}

type InlineNode = TextNode;

interface HeadingNode {
  type: "heading";
  attrs: { level: number };
  content: InlineNode[];
}

interface ParagraphNode {
  type: "paragraph";
  content?: InlineNode[];
}

interface BulletListNode {
  type: "bulletList";
  content: ListItemNode[];
}

interface OrderedListNode {
  type: "orderedList";
  attrs: { start: number };
  content: ListItemNode[];
}

interface ListItemNode {
  type: "listItem";
  content: [ParagraphNode];
}

type BlockNode = HeadingNode | ParagraphNode | BulletListNode | OrderedListNode;

/* -------------------------------------------------------------------------- */
/* Inline Markdown parser                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Strip raw Markdown syntax that we can't represent (images, badges, HTML tags,
 * reference-link brackets) while keeping the human-readable text.
 */
function stripUnsupportedMarkdown(text: string): string {
  return (
    text
      // Remove markdown images: ![alt](url) or [![alt](url)](url)
      .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Strip raw HTML tags
      .replace(/<[^>]+>/g, "")
      // Remove HTML entities
      .replace(/&[a-z]+;/gi, " ")
      .trim()
  );
}

/**
 * Parse a line of Markdown into an array of Tiptap inline nodes with marks.
 * Supports: **bold**, *italic*, `code`, [link](url).
 * Unknown/complex constructs fall back to plain text.
 */
function parseInline(raw: string): InlineNode[] {
  const text = stripUnsupportedMarkdown(raw);
  if (!text) return [];

  const nodes: InlineNode[] = [];
  // Regex matches bold, italic, code, or links — in that priority order.
  const pattern =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: intentional
  while ((match = pattern.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // **bold**
      nodes.push({
        type: "text",
        text: match[2],
        marks: [{ type: "bold" }],
      });
    } else if (match[3] !== undefined) {
      // *italic*
      nodes.push({
        type: "text",
        text: match[4],
        marks: [{ type: "italic" }],
      });
    } else if (match[5] !== undefined) {
      // `code`
      nodes.push({
        type: "text",
        text: match[6],
        marks: [{ type: "code" }],
      });
    } else if (match[7] !== undefined) {
      // [link](url)
      nodes.push({
        type: "text",
        text: match[8],
        marks: [{ type: "link", attrs: { href: match[9], target: "_blank" } }],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return nodes;
}

/* -------------------------------------------------------------------------- */
/* Block-level parser                                                          */
/* -------------------------------------------------------------------------- */

function parseBlock(block: string): BlockNode {
  const lines = block.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { type: "paragraph" };
  }

  const first = lines[0];

  // Heading: # H1, ## H2, … ## H6
  const headingMatch = /^(#{1,6})\s+(.+)$/.exec(first);
  if (headingMatch) {
    const level = Math.min(6, headingMatch[1].length) as 1 | 2 | 3 | 4 | 5 | 6;
    const headingText = headingMatch[2].trim();
    const inlineNodes = parseInline(headingText);
    return {
      type: "heading",
      attrs: { level },
      content: inlineNodes.length > 0 ? inlineNodes : [{ type: "text", text: headingText }],
    };
  }

  // Unordered list: -, *, + bullets
  const bulletRe = /^[-*+]\s+(.+)$/;
  if (lines.every((l) => bulletRe.test(l))) {
    const items: ListItemNode[] = lines.map((l) => {
      const m = bulletRe.exec(l);
      const content = parseInline(m ? m[1] : l);
      return {
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: content.length > 0 ? content : [{ type: "text", text: l }],
          },
        ],
      };
    });
    return { type: "bulletList", content: items };
  }

  // Ordered list: 1. item
  const orderedRe = /^\d+\.\s+(.+)$/;
  if (lines.every((l) => orderedRe.test(l))) {
    const items: ListItemNode[] = lines.map((l) => {
      const m = orderedRe.exec(l);
      const content = parseInline(m ? m[1] : l);
      return {
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: content.length > 0 ? content : [{ type: "text", text: l }],
          },
        ],
      };
    });
    return { type: "orderedList", attrs: { start: 1 }, content: items };
  }

  // Default: paragraph — join all lines as a paragraph with inline parsing
  const combined = lines.join(" ");
  const inlineNodes = parseInline(combined);
  return {
    type: "paragraph",
    content: inlineNodes.length > 0 ? inlineNodes : [{ type: "text", text: combined }],
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export function textToTiptapContent(raw: string): unknown {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();

  if (!text) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  // Split on one or more blank lines to get logical blocks.
  const rawBlocks = text.split(/\n{2,}/);
  const content: BlockNode[] = rawBlocks
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
    .map(parseBlock);

  // Ensure the doc always has at least one node (Tiptap requirement).
  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

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
