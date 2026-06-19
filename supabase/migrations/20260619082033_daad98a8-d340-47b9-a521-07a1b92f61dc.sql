
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO anon, authenticated;
GRANT ALL ON public.files TO service_role;

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read files" ON public.files FOR SELECT USING (true);
CREATE POLICY "Public insert files" ON public.files FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete files" ON public.files FOR DELETE USING (true);

-- Storage policies on the 'files' bucket (private bucket, but openly accessible via Data API)
CREATE POLICY "Public read storage files"
ON storage.objects FOR SELECT
USING (bucket_id = 'files');

CREATE POLICY "Public upload storage files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'files');

CREATE POLICY "Public delete storage files"
ON storage.objects FOR DELETE
USING (bucket_id = 'files');
