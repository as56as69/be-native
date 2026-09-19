-- =====================================================================
--  Be Native — Supabase/PostgreSQL schema
--  Applies cleanly to a fresh Supabase project or a local `supabase start`.
--  Idempotent: safe to re-run in any order.
-- =====================================================================

begin;

-- ---------------------------------------------------------------- enums
do $$ begin
  create type user_tier as enum ('free', 'standard', 'professional');
exception when duplicate_object then null; end $$;

do $$ begin
  create type spot_category as enum
    ('cafe', 'restaurant', 'gym', 'taxi_delivery', 'university', 'street_vendor', 'bookshop');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------- users
create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  phone           text unique,
  auth_id         text unique,
  credits_balance integer not null default 0 check (credits_balance >= 0),
  current_tier    user_tier not null default 'free',
  created_at      timestamptz not null default now(),
  constraint users_has_identifier check (phone is not null or auth_id is not null)
);

-- ----------------------------------------------------------------- spots
-- 50 Locations Engine — nodes of the 2D Doodle Map.
create table if not exists public.spots (
  id               uuid primary key default gen_random_uuid(),
  title_ar         text not null,
  title_en         text not null,
  category         spot_category not null,
  vibe_description text,
  position_x       double precision not null default 0,  -- doodle map X
  position_y       double precision not null default 0,  -- doodle map Y
  is_locked        boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists spots_category_idx on public.spots (category);
create index if not exists spots_locked_idx on public.spots (is_locked);

-- -------------------------------------------------------------- scenarios
-- Graph Rules Content — multi-NPC conversation graphs, order errors, interrupts.
create table if not exists public.scenarios (
  id              uuid primary key default gen_random_uuid(),
  spot_id         uuid not null references public.spots (id) on delete cascade,
  title           text not null,
  system_prompt   text not null default '',
  graph_rules     jsonb not null default '{}'::jsonb,
  provider_config jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists scenarios_spot_id_idx on public.scenarios (spot_id);

-- ---------------------------------------------------------------- vouchers
-- Barcodes & activation codes.
create table if not exists public.vouchers (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  credit_amount       integer not null check (credit_amount > 0),
  is_redeemed         boolean not null default false,
  redeemed_by_user_id uuid references public.users (id) on delete set null,
  redeemed_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists vouchers_code_idx on public.vouchers (code);

-- ------------------------------------------------------------ api_providers
-- Dynamic Provider Switcher — LLM/TTS providers with priority & cost.
create table if not exists public.api_providers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,                       -- 'OpenAI' | 'Anthropic' | 'ElevenLabs' | 'Grok' ...
  api_key_encrypted   text,                                -- app-layer encryption, never plaintext
  is_active           boolean not null default false,
  priority            integer not null default 100,        -- lower = tried first
  cost_per_token      double precision not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists api_providers_priority_idx on public.api_providers (is_active, priority);

-- ------------------------------------------------------------------- RLS
alter table public.users         enable row level security;
alter table public.spots         enable row level security;
alter table public.scenarios     enable row level security;
alter table public.vouchers      enable row level security;
alter table public.api_providers enable row level security;

-- Supabase ships the anon/authenticated/service_role roles on every project.
grant usage on schema public to anon, authenticated;

-- Unlocked spots are publicly readable (map browsing).
drop policy if exists "spots are readable when unlocked" on public.spots;
create policy "spots are readable when unlocked"
  on public.spots for select to anon, authenticated
  using (is_locked = false);

-- Users manage their own profile row.
drop policy if exists "users manage own profile" on public.users;
create policy "users manage own profile"
  on public.users for all to authenticated
  using (auth_id is not null and auth.uid()::text = auth_id)
  with check (auth_id is not null and auth.uid()::text = auth_id);

commit;