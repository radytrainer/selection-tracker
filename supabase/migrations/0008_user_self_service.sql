-- ============================================================================
-- Lets every signed-in user manage their own profile (name, phone, avatar)
-- from the new /account page. Previously `users` only had a super_admin
-- write policy, and the only image bucket (`partner-logos`) is role-
-- restricted to staff/NGO partners — neither covers an arbitrary user
-- uploading their own profile photo.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Avatar objects live under `{firebase_uid}/...` — every signed-in user may
-- read any avatar (they're public-facing in the topbar/tables) but write
-- only inside their own folder.
create policy avatars_public_read on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_write_own on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

create policy avatars_update_own on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

create policy avatars_delete_own on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

-- Self-service profile updates: any signed-in user may update their own
-- `users` row, but a trigger blocks changes to fields that aren't theirs to
-- change (firebase_uid, email, status, deleted_at) — RBAC management of
-- those stays on the existing super_admin-only `users_admin_write` policy.
create or replace function guard_users_self_update() returns trigger
language plpgsql as $$
begin
  if auth_role() <> 'super_admin' then
    if new.firebase_uid <> old.firebase_uid
       or new.email <> old.email
       or new.status <> old.status
       or new.deleted_at is distinct from old.deleted_at then
      raise exception 'Not permitted to change this field';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_users_self_update_guard before update on users
  for each row execute function guard_users_self_update();

create policy users_update_self on users for update using (
  firebase_uid = (auth.jwt() ->> 'sub')
) with check (
  firebase_uid = (auth.jwt() ->> 'sub')
);
