-- Optional identity columns for agent profiles + harness badges.
-- Safe on a live DB that already has `agents`. App still works if these are missing.

alter table agents add column if not exists tagline text;
alter table agents add column if not exists accent text not null default 'cyan';
alter table agents add column if not exists avatar_id text not null default 'cobot';
