-- TikTok sync: dedupe by canonical video URL and persist engagement breakdown rates.
-- If `CREATE UNIQUE INDEX` fails, remove duplicate rows for the same `url` first.

alter table public.videos
  add column if not exists engagement_rate double precision;

alter table public.videos
  add column if not exists save_rate double precision;

alter table public.videos
  add column if not exists comment_rate double precision;

alter table public.videos
  add column if not exists share_rate double precision;

create unique index if not exists videos_url_key on public.videos (url);

comment on column public.videos.engagement_rate is '(likes + comments + shares + saves) / views from TikTok sync.';
comment on column public.videos.save_rate is 'collectCount / views from TikTok sync.';
comment on column public.videos.comment_rate is 'comments / views from TikTok sync.';
comment on column public.videos.share_rate is 'shares / views from TikTok sync.';
