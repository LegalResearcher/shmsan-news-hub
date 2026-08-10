
CREATE POLICY "staff read media objects" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff upload media objects" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update media objects" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff delete media objects" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.is_staff(auth.uid()));
