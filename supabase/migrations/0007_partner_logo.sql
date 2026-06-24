-- ============================================================================
-- Adds a logo image to NGO/school partners — a public storage bucket (logos
-- aren't sensitive, unlike student-documents) plus a logo_url column on each
-- partner table pointing at the uploaded object's public URL.
-- ============================================================================

alter table ngo_partners add column logo_url text;
alter table school_partners add column logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('partner-logos', 'partner-logos', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

create policy partner_logos_public_read on storage.objects for select
  using (bucket_id = 'partner-logos');

create policy partner_logos_write on storage.objects for insert
  with check (
    bucket_id = 'partner-logos'
    and (auth_role() in ('super_admin','program_manager') or auth_role() = 'ngo_partner')
  );

create policy partner_logos_update on storage.objects for update
  using (
    bucket_id = 'partner-logos'
    and (auth_role() in ('super_admin','program_manager') or auth_role() = 'ngo_partner')
  );

create policy partner_logos_delete on storage.objects for delete
  using (
    bucket_id = 'partner-logos'
    and (auth_role() in ('super_admin','program_manager') or auth_role() = 'ngo_partner')
  );
