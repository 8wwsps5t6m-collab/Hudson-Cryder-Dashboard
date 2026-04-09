-- Phase 2: permissive RLS for local single-user development.
-- Replace with real auth-bound policies before any public or multi-tenant launch.

alter table public.videos enable row level security;

alter table public.analytics_snapshots enable row level security;

drop policy if exists "dev_allow_all_videos" on public.videos;

create policy "dev_allow_all_videos" on public.videos
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "dev_allow_all_analytics_snapshots" on public.analytics_snapshots;

create policy "dev_allow_all_analytics_snapshots" on public.analytics_snapshots
  for all
  to anon, authenticated
  using (true)
  with check (true);
