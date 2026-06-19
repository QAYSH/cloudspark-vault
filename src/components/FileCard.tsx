import { useEffect, useState } from "react";
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  File as FileIcon,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { kindOf, formatSize, formatDate, type FileRow } from "@/lib/file-utils";

type Props = {
  file: FileRow;
  onPreview: () => void;
  onDelete: () => void;
  index: number;
};

const ICONS: Record<ReturnType<typeof kindOf>, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  text: FileText,
  office: FileText,
  archive: FileArchive,
  code: FileCode,
  other: FileIcon,
};

const TINTS: Record<ReturnType<typeof kindOf>, string> = {
  pdf: "from-rose-500/30 to-orange-500/20 text-rose-200",
  image: "from-emerald-500/30 to-teal-500/20 text-emerald-200",
  video: "from-fuchsia-500/30 to-purple-500/20 text-fuchsia-200",
  audio: "from-amber-500/30 to-yellow-500/20 text-amber-200",
  text: "from-sky-500/30 to-cyan-500/20 text-sky-200",
  office: "from-blue-500/30 to-indigo-500/20 text-blue-200",
  archive: "from-stone-500/30 to-zinc-500/20 text-stone-200",
  code: "from-violet-500/30 to-indigo-500/20 text-violet-200",
  other: "from-slate-500/30 to-zinc-500/20 text-slate-200",
};

export function FileCard({ file, onPreview, onDelete, index }: Props) {
  const kind = kindOf(file);
  const Icon = ICONS[kind];
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "image") return;
    let cancelled = false;
    supabase.storage
      .from("files")
      .createSignedUrl(file.storage_path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setThumb(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [file.storage_path, kind]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data } = await supabase.storage
      .from("files")
      .createSignedUrl(file.storage_path, 60 * 60, { download: file.name });
    if (!data?.signedUrl) return;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className="group glass rounded-2xl overflow-hidden hover-lift cursor-pointer animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      onClick={onPreview}
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${TINTS[kind]}`}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={file.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <Icon className="h-16 w-16 opacity-80 transition-transform duration-500 group-hover:scale-110" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full glass-strong">
            {kind === "other" ? "file" : kind}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full glass-strong border-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full glass-strong border-white/10"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full glass-strong border-white/10 hover:bg-destructive/30"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              onClick={(e) => e.stopPropagation()}
              className="glass-strong border-white/10"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this file?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{file.name}" will be permanently removed. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="p-4">
        <p className="font-medium text-sm truncate" title={file.name}>
          {file.name}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatSize(file.size)}</span>
          <span>{formatDate(file.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
