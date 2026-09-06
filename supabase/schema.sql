-- Assumption: run in Supabase SQL editor. Idempotent. Match inserts use the service role (bypasses RLS).
-- Auth: enable GitHub provider. Redirect URL: http://localhost:3000/auth/callback (and :3001 if needed).

create table if not exists profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  github_url text,
  api_key text unique not null default gen_random_uuid(),
  created_at timestamptz default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  name text not null,
  description text,
  repo_url text,
  elo_rating integer default 1200,
  tagline text,
  accent text not null default 'cyan',
  avatar_id text not null default 'cobot',
  created_at timestamptz default now()
);

create unique index if not exists agents_name_unique on agents (name);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) not null,
  task_type text not null default 'block_stacking',
  spatial_accuracy numeric,
  task_completion_score numeric,
  -- jsonb { peak, avg, eval?: { failure, provenance, sampler_seed, control, signature, alg } } — extra eval keys need no migration
  joint_torque_telemetry jsonb,
  elo_delta integer,
  status text default 'pending',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) not null,
  elo_rating integer not null,
  rank integer not null,
  snapshot_at timestamptz default now()
);

alter table profiles enable row level security;
alter table agents enable row level security;
alter table matches enable row level security;
alter table leaderboard_snapshots enable row level security;

drop policy if exists "profiles_read" on profiles;
drop policy if exists "profiles_write_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "agents_read" on agents;
drop policy if exists "agents_write_own" on agents;
drop policy if exists "agents_update_own" on agents;
drop policy if exists "matches_read" on matches;
drop policy if exists "snapshots_read" on leaderboard_snapshots;

create policy "profiles_read" on profiles for select using (true);
create policy "profiles_write_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

create policy "agents_read" on agents for select using (true);
create policy "agents_write_own" on agents for insert with check (owner_id = auth.uid());
create policy "agents_update_own" on agents for update using (owner_id = auth.uid());

create policy "matches_read" on matches for select using (true);
create policy "snapshots_read" on leaderboard_snapshots for select using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  handle text;
begin
  handle := lower(coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1),
    'user'
  ));
  handle := regexp_replace(handle, '[^a-z0-9-]', '', 'g');
  if handle = '' then
    handle := 'user-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, username, github_url)
  values (
    new.id,
    handle,
    case when new.raw_user_meta_data->>'user_name' is not null
      then 'https://github.com/' || (new.raw_user_meta_data->>'user_name')
      else null
    end
  )
  on conflict (id) do nothing;
  return new;
exception
  when unique_violation then
    insert into public.profiles (id, username, github_url)
    values (
      new.id,
      handle || '-' || substr(replace(new.id::text, '-', ''), 1, 8),
      case when new.raw_user_meta_data->>'user_name' is not null
        then 'https://github.com/' || (new.raw_user_meta_data->>'user_name')
        else null
      end
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Public clients must not read api_key. Account + harness use the service role.
revoke select (api_key) on table public.profiles from anon, authenticated;
