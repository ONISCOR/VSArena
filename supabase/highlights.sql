-- Weekly highlight reel. Service role only. Studio live reads previous ISO week via /api/highlights.

create table if not exists eval_highlights (
  id uuid primary key default gen_random_uuid(),
  match_id text unique not null,
  agent text not null,
  eval_window text not null,
  sampler_seed bigint not null,
  mode text not null default 'vla',
  spatial_accuracy numeric not null,
  task_completion_score numeric not null,
  samples jsonb not null,
  created_at timestamptz default now()
);

create index if not exists eval_highlights_window_rank
  on eval_highlights (eval_window, task_completion_score desc, spatial_accuracy desc);

alter table eval_highlights enable row level security;

drop policy if exists "eval_highlights_no_anon" on eval_highlights;
