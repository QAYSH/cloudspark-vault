// IndexedDB-backed file store — files persist per-browser, no server required.
import type { FileRow } from "./file-utils";

const DB_NAME = "vault-db";
const DB_VERSION = 1;
const STORE = "files";

type StoredFile = {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  created_at: string;
  blob: Blob;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("created_at", "created_at");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        let result: T;
        Promise.resolve(fn(store)).then((r) => {
          if (r && typeof (r as IDBRequest).onsuccess !== "undefined") {
            const req = r as IDBRequest<T>;
            req.onsuccess = () => {
              result = req.result;
            };
            req.onerror = () => reject(req.error);
          } else {
            result = r as T;
          }
        });
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export function toRow(s: StoredFile): FileRow {
  return {
    id: s.id,
    name: s.name,
    storage_path: s.id,
    mime_type: s.mime_type,
    size: s.size,
    created_at: s.created_at,
  };
}

export async function listFiles(): Promise<FileRow[]> {
  const all = await tx<StoredFile[]>("readonly", (store) => store.getAll());
  return all
    .map(toRow)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function addFile(file: File): Promise<FileRow> {
  const record: StoredFile = {
    id: crypto.randomUUID(),
    name: file.name,
    mime_type: file.type || "application/octet-stream",
    size: file.size,
    created_at: new Date().toISOString(),
    blob: file,
  };
  await tx<IDBValidKey>("readwrite", (store) => store.add(record));
  return toRow(record);
}

export async function deleteFile(id: string): Promise<void> {
  await tx<undefined>("readwrite", (store) => store.delete(id));
}

export async function getBlob(id: string): Promise<Blob | null> {
  const rec = await tx<StoredFile | undefined>("readonly", (store) =>
    store.get(id),
  );
  return rec?.blob ?? null;
}

export async function getObjectURL(id: string): Promise<string | null> {
  const blob = await getBlob(id);
  return blob ? URL.createObjectURL(blob) : null;
}
