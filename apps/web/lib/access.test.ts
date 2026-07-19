import { describe, expect, it } from "vitest";
import {
  canDelete,
  canEdit,
  canRead,
  canShare,
  resolveAccess,
} from "@/lib/access";
import { filenameToTitle, isSupportedImportFile, textToTiptapContent } from "@/lib/import";

describe("access control (mock users)", () => {
  it("owner can read, edit, share and delete", () => {
    const role = resolveAccess("user-1", "user-1", []);
    expect(role).toBe("owner");
    expect(canRead(role)).toBe(true);
    expect(canEdit(role)).toBe(true);
    expect(canShare(role)).toBe(true);
    expect(canDelete(role)).toBe(true);
  });

  it("shared user can read and edit but cannot share or delete", () => {
    const role = resolveAccess("user-1", "user-2", ["user-2"]);
    expect(role).toBe("shared");
    expect(canRead(role)).toBe(true);
    expect(canEdit(role)).toBe(true);
    expect(canShare(role)).toBe(false);
    expect(canDelete(role)).toBe(false);
  });

  it("unshared user cannot access", () => {
    const role = resolveAccess("user-1", "user-3", []);
    expect(role).toBe("none");
    expect(canRead(role)).toBe(false);
    expect(canEdit(role)).toBe(false);
    expect(canShare(role)).toBe(false);
    expect(canDelete(role)).toBe(false);
  });
});

describe("file import conversion", () => {
  it("rejects unsupported files", () => {
    expect(isSupportedImportFile("notes.docx")).toBe(false);
    expect(isSupportedImportFile("notes.txt")).toBe(true);
    expect(isSupportedImportFile("notes.md")).toBe(true);
  });

  it("derives a title from the filename without extension", () => {
    expect(filenameToTitle("meeting-notes.txt")).toBe("meeting-notes");
    expect(filenameToTitle("README.md")).toBe("README");
  });

  it("converts plain text into valid Tiptap paragraphs", () => {
    const doc = textToTiptapContent("Hello world\n\nSecond paragraph") as {
      type: string;
      content: { type: string; content: { type: string; text: string }[] }[];
    };
    expect(doc.type).toBe("doc");
    expect(doc.content).toHaveLength(2);
    expect(doc.content[0].content[0].text).toBe("Hello world");
  });

  it("treats markdown headings as Tiptap headings", () => {
    const doc = textToTiptapContent("# Title\n\nBody text") as {
      type: string;
      content: { type: string; attrs?: { level: number } }[];
    };
    expect(doc.content[0].type).toBe("heading");
    expect(doc.content[0].attrs?.level).toBe(1);
  });

  it("returns an empty paragraph for blank input", () => {
    const doc = textToTiptapContent("") as { content: unknown[] };
    expect(doc.content).toHaveLength(1);
  });
});
