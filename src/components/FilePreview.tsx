import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Loader2, FileQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { kindOf, formatSize, type FileRow } from "@/lib/file-utils";

type Props = {
  file: FileRow | null;
  onOpenChange: (open: boolean) => void;
};

export function FilePreview({ file, onOpenChange }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      setTextContent(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setTextContent(null);
    (async () => {
      const { data } = await supabase.storage
        .from("files")
        .createSignedUrl(file.storage_path, 60 * 60);
      if (cancelled) return;
      const signed = data?.signedUrl ?? null;
      setUrl(signed);

      if (signed && kindOf(file) === "text") {
        try {
          const res = await fetch(signed);
          const txt = await res.text();
          if (!cancelled) setTextContent(txt.slice(0, 200_000));
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleDownload = async () => {
    if (!file || !url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const kind = file ? kindOf(file) : "other";

  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass-strong max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 border-white/10 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base font-medium font-display">
              {file?.name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {file ? `${formatSize(file.size)} • ${file.mime_type || "file"}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90"
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              size="icon"
              variant="ghost"
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-black/30 relative">
          {loading || !url ? (
            <div className="absolute inset-0 grid place-items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <PreviewBody kind={kind} url={url} file={file!} textContent={textContent} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  kind,
  url,
  file,
  textContent,
}: {
  kind: ReturnType<typeof kindOf>;
  url: string;
  file: FileRow;
  textContent: string | null;
}) {
  if (kind === "pdf") {
    return (
      <iframe
        src={url}
        className="w-full h-full bg-white"
        title={file.name}
      />
    );
  }
  if (kind === "image") {
    return (
      <div className="w-full h-full overflow-auto grid place-items-center p-6">
        <img
          src={url}
          alt={file.name}
          className="max-w-full max-h-full object-contain rounded-md shadow-soft animate-scale-in"
        />
      </div>
    );
  }
  if (kind === "video") {
    return (
      <div className="w-full h-full grid place-items-center p-6">
        <video src={url} controls className="max-w-full max-h-full rounded-md shadow-soft" />
      </div>
    );
  }
  if (kind === "audio") {
    return (
      <div className="w-full h-full grid place-items-center p-10">
        <div className="glass p-8 rounded-2xl w-full max-w-xl">
          <p className="text-sm text-muted-foreground mb-4 truncate">{file.name}</p>
          <audio src={url} controls className="w-full" />
        </div>
      </div>
    );
  }
  if (kind === "text" || kind === "code") {
    return (
      <pre className="w-full h-full overflow-auto p-6 text-sm leading-relaxed font-mono text-foreground/90 whitespace-pre-wrap break-words bg-black/20">
        {textContent ?? ""}
      </pre>
    );
  }
  if (kind === "office") {
    const viewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return (
      <iframe
        src={viewer}
        className="w-full h-full bg-white"
        title={file.name}
      />
    );
  }
  return (
    <div className="w-full h-full grid place-items-center p-10 text-center">
      <div className="max-w-sm">
        <FileQuestion className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
        <p className="text-foreground font-medium">No inline preview</p>
        <p className="text-sm text-muted-foreground mt-1">
          This file type can't be previewed in the browser, but you can still download it.
        </p>
      </div>
    </div>
  );
}
