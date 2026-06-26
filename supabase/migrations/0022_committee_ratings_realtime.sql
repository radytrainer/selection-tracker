-- Live vote updates on the Committee Dossier (app/(dashboard)/committee/[studentId])
-- subscribe to Postgres changes on this table instead of polling or running
-- a separate websocket server. Realtime enforces the same RLS as normal
-- queries, so committee_member still only ever receives change events for
-- their own row (see migration 0021) — broadcasting changes doesn't widen
-- who can see whose vote.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'committee_ratings'
  ) then
    alter publication supabase_realtime add table committee_ratings;
  end if;
end $$;
