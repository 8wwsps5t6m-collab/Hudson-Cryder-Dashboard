-- Adds saves + hook_type to public.videos (run once in Supabase SQL Editor).

alter table public.videos
  add column if not exists saves bigint not null default 0;

alter table public.videos
  add column if not exists hook_type text not null default 'both';

alter table public.videos drop constraint if exists videos_hook_type_check;

alter table public.videos
  add constraint videos_hook_type_check check (
    hook_type in ('visual', 'verbal', 'both')
  );

comment on column public.videos.saves is 'TikTok saves; included in engagement rate.';

comment on column public.videos.hook_type is 'visual | verbal | both';
