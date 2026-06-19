import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addFile } from "@/lib/file-store";

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
        try {
          await addFile(file);
          done += 1;
          setProgress({ name: file.name, done, total });
        } catch (err) {
          toast.error(`Upload failed: ${file.name}`, {
            description: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      setProgress(null);
      toast.success(
        done === total
          ? `Saved ${done} ${done === 1 ? "file" : "files"} to your browser`
          : `Saved ${done} of ${total}`,
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
              Saving{" "}
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
            : "PDFs, images, video, audio, documents — stored privately in your browser."}
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
