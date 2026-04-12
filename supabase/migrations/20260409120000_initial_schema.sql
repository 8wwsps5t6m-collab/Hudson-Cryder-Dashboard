-- CreatorDash Phase 1 schema: videos, ideas, analytics_snapshots
-- Apply in Supabase: SQL Editor → New query → paste → Run,
-- or use Supabase CLI: supabase db push (when linked).

-- Videos: past posts and performance fields used in Phase 2 dashboards.

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid (),
  url text not null,
  views bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  hook_type text not null default 'both'
    constraint videos_hook_type_check check (
      hook_type in ('visual', 'verbal', 'both')
    ),
  hook_text text,
  format_type text not null default 'other'
    constraint videos_format_type_check check (
      format_type in (
        'talking_head',
        'trendy_audio_edit',
        'fit_check',
        'day_in_the_life',
        'other'
      )
    ),
  date_posted timestamptz not null,
  performance_score double precision,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_date_posted_idx on public.videos (date_posted desc);

create index if not exists videos_format_type_idx on public.videos (format_type);

create index if not exists videos_performance_score_idx on public.videos (performance_score desc nulls last);

-- Ideas: brainstormed or AI-generated concepts (Phase 3 saves).

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid (),
  title text not null,
  description text,
  format_type text not null default 'other'
    constraint ideas_format_type_check check (
      format_type in (
        'talking_head',
        'trendy_audio_edit',
        'fit_check',
        'day_in_the_life',
        'other'
      )
    ),
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_status_idx on public.ideas (status);

create index if not exists ideas_created_at_idx on public.ideas (created_at desc);

-- Account-level snapshots (follower count and average views by day).

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid (),
  follower_count integer not null,
  snapshot_date date not null,
  avg_views double precision,
  created_at timestamptz not null default now(),
  constraint analytics_snapshots_snapshot_date_key unique (snapshot_date)
);

create index if not exists analytics_snapshots_snapshot_date_idx on public.analytics_snapshots (snapshot_date desc);

-- RLS: enable later with real auth policies. Tables stay private to your project
-- keys until you ship client-side queries.

comment on table public.videos is 'TikTok posts and stats for CreatorDash analytics.';

comment on table public.ideas is 'Content ideas and workflow notes.';

comment on table public.analytics_snapshots is 'Daily follower and average view snapshots.';
