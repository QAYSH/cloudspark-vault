export type FileRow = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  created_at: string;
};

export type FileKind =
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "text"
  | "office"
  | "archive"
  | "code"
  | "other";

export function kindOf(file: { mime_type: string; name: string }): FileKind {
  const m = (file.mime_type || "").toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (m === "application/pdf" || ext === "pdf") return "pdf";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (
    m.startsWith("text/") ||
    ["txt", "md", "csv", "log", "rtf"].includes(ext)
  )
    return "text";
  if (
    [
      "doc",
      "docx",
      "ppt",
      "pptx",
      "xls",
      "xlsx",
      "odt",
      "ods",
      "odp",
    ].includes(ext)
  )
    return "office";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "go",
      "rs",
      "java",
      "c",
      "cpp",
      "html",
      "css",
      "json",
      "xml",
      "yml",
      "yaml",
      "sh",
    ].includes(ext)
  )
    return "code";
  return "other";
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
