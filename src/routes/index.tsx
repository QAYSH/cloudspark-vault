import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles, FolderOpen, Files } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Uploader } from "@/components/Uploader";
import { FileCard } from "@/components/FileCard";
import { FilePreview } from "@/components/FilePreview";
import { Input } from "@/components/ui/input";
import { formatSize, type FileRow } from "@/lib/file-utils";
import { listFiles, deleteFile } from "@/lib/file-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vault — Premium File Library" },
      {
        name: "description",
        content: "Upload, preview and manage PDFs, images, video, audio and documents — stored privately in your browser.",
      },
    ],
  }),
  component: Index,
  ssr: false,
});

function Index() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<FileRow | null>(null);

  const load = async () => {
    try {
      const rows = await listFiles();
      setFiles(rows);
    } catch (err) {
      toast.error("Could not load library", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query]);

  const totalSize = useMemo(
    () => files.reduce((s, f) => s + (f.size || 0), 0),
    [files],
  );

  const handleDelete = async (file: FileRow) => {
    const prev = files;
    setFiles((f) => f.filter((x) => x.id !== file.id));
    try {
      await deleteFile(file.id);
      toast.success(`Deleted "${file.name}"`);
    } catch (err) {
      toast.error("Could not delete file", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setFiles(prev);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-20 h-[420px] w-[420px] rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div
          className="absolute top-1/3 -right-24 h-[420px] w-[420px] rounded-full bg-accent/25 blur-3xl animate-blob"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-fuchsia-500/20 blur-3xl animate-blob"
          style={{ animationDelay: "8s" }}
        />
      </div>

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: "glass-strong border-white/10",
        }}
      />

      {/* Nav */}
      <header className="px-6 md:px-10 pt-8">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight">
                Vault
              </h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">
                Your personal file library
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="glass px-3 py-1.5 rounded-full">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
            <span className="glass px-3 py-1.5 rounded-full">
              {formatSize(totalSize)} stored
            </span>
          </div>
        </nav>
      </header>

      <main className="px-6 md:px-10 py-12">
        <section className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto animate-fade-up">
            <span className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full text-xs text-muted-foreground mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              100% local · Stored in your browser
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
              Your files,{" "}
              <span className="text-gradient">beautifully organized.</span>
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground">
              Drop in PDFs, photos, videos, documents — preview them inline,
              download anytime, delete in a tap.
            </p>
          </div>

          <div className="mt-10 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <Uploader onUploaded={load} />
          </div>

          {/* Library */}
          <div className="mt-16 animate-fade-up" style={{ animationDelay: "240ms" }}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-3">
                  <FolderOpen className="h-6 w-6 text-primary" />
                  Library
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {files.length === 0
                    ? "Your uploads will appear here."
                    : `${filtered.length} of ${files.length} ${files.length === 1 ? "file" : "files"} shown`}
                </p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search files..."
                  className="pl-9 h-11 glass border-white/10 focus-visible:ring-primary/40"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass rounded-2xl overflow-hidden h-64 animate-shimmer"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-3xl p-16 text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl glass grid place-items-center mb-5">
                  <Files className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-lg">
                  {query ? "No files match your search" : "Your vault is empty"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {query
                    ? "Try a different name."
                    : "Drop your first file above to get started."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filtered.map((file, i) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    index={i}
                    onPreview={() => setPreview(file)}
                    onDelete={() => handleDelete(file)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="max-w-6xl mx-auto mt-24 pb-6 text-center text-xs text-muted-foreground">
          Crafted with care · Files stored locally via IndexedDB
        </footer>
      </main>

      <FilePreview file={preview} onOpenChange={(o) => !o && setPreview(null)} />
    </div>
  );
}
