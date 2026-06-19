import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  onUploaded: () => void;
};

export function Uploader({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ name: string; done: number; total: number } | null>(
    null,
  );

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;
      const total = files.length;
      let done = 0;

      for (const file of files) {
        setProgress({ name: file.name, done, total });
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
        const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
        const path = `${crypto.randomUUID()}${ext ? "." + ext : ""}-${safeName}`;

        const { error: upErr } = await supabase.storage
          .from("files")
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (upErr) {
          toast.error(`Upload failed: ${file.name}`, { description: upErr.message });
          continue;
        }

        const { error: dbErr } = await supabase.from("files").insert({
          name: file.name,
          storage_path: path,
          mime_type: file.type || "application/octet-stream",
          size: file.size,
        });

        if (dbErr) {
          toast.error(`Could not save metadata for ${file.name}`, {
            description: dbErr.message,
          });
          await supabase.storage.from("files").remove([path]);
          continue;
        }

        done += 1;
        setProgress({ name: file.name, done, total });
      }

      setProgress(null);
      toast.success(
        done === total
          ? `Uploaded ${done} ${done === 1 ? "file" : "files"}`
          : `Uploaded ${done} of ${total}`,
      );
      onUploaded();
    },
    [onUploaded],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      className={`relative group cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 ${
        dragging ? "ring-glow scale-[1.01]" : ""
      }`}
    >
      <div className="glass-strong rounded-3xl p-10 md:p-14 text-center border-dashed border-white/15">
        <div
          className={`mx-auto h-16 w-16 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow ${
            progress ? "" : "animate-float"
          }`}
        >
          {progress ? (
            <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />
          ) : (
            <UploadCloud className="h-7 w-7 text-primary-foreground" />
          )}
        </div>
        <h3 className="mt-5 font-display text-xl md:text-2xl font-semibold">
          {progress ? (
            <>
              Uploading{" "}
              <span className="text-gradient">
                {progress.done + 1} / {progress.total}
              </span>
            </>
          ) : (
            <>
              Drop files here or{" "}
              <span className="text-gradient">click to browse</span>
            </>
          )}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {progress
            ? `${progress.name}`
            : "PDFs, images, video, audio, documents — any file type, up to 50 MB each."}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
