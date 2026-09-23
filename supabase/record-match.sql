-- Atomic official match ingest: lock agent row, compute ELO, insert match.
-- Run in Supabase SQL editor after schema.sql. Idempotent.

create or replace function public.record_official_match(
  p_agent_id uuid,
  p_owner_id uuid,
  p_match_id uuid,
  p_status text,
  p_spatial numeric,
  p_completion numeric,
  p_outcome numeric,
  p_telemetry jsonb,
  p_task_type text default 'block_stacking'
)
returns table (
  elo_delta integer,
  elo_rating integer,
  stored_at timestamptz,
  agent_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rating numeric;
  v_played integer;
  v_k numeric;
  v_expected numeric;
  v_delta integer;
  v_outcome numeric;
  v_now timestamptz := now();
  v_name text;
begin
  if p_status is distinct from 'completed' and p_status is distinct from 'failed' then
    raise exception 'invalid match status';
  end if;

  select a.elo_rating, a.name
    into v_rating, v_name
  from public.agents a
  where a.id = p_agent_id
    and a.owner_id = p_owner_id
  for update;

  if not found then
    raise exception 'agent not found or not owned';
  end if;

  select count(*)::integer into v_played
  from public.matches m
  where m.agent_id = p_agent_id;

  v_rating := coalesce(v_rating, 1200);
  -- Binary stack outcome: full tower = 1, anything else = 0 (partial credit does not move ELO).
  v_outcome := case when coalesce(p_outcome, 0) >= 1 then 1 else 0 end;
  v_k := case
    when v_played < 8 then 40
    when v_played < 24 then 24
    else 16
  end;
  v_expected := 1.0 / (1.0 + power(10::numeric, (1200::numeric - v_rating) / 400.0));
  v_delta := round(v_k * (v_outcome - v_expected))::integer;

  update public.agents
  set elo_rating = (v_rating + v_delta)::integer
  where id = p_agent_id;

  insert into public.matches (
    id,
    agent_id,
    task_type,
    spatial_accuracy,
    task_completion_score,
    joint_torque_telemetry,
    elo_delta,
    status,
    completed_at
  ) values (
    coalesce(p_match_id, gen_random_uuid()),
    p_agent_id,
    coalesce(p_task_type, 'block_stacking'),
    p_spatial,
    p_completion,
    p_telemetry,
    v_delta,
    p_status,
    v_now
  );

  elo_delta := v_delta;
  elo_rating := (v_rating + v_delta)::integer;
  stored_at := v_now;
  agent_name := v_name;
  return next;
end;
$$;

revoke all on function public.record_official_match(
  uuid, uuid, uuid, text, numeric, numeric, numeric, jsonb, text
) from public;
grant execute on function public.record_official_match(
  uuid, uuid, uuid, text, numeric, numeric, numeric, jsonb, text
) to service_role;
