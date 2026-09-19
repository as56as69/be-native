-- Scenario graphs: strict JSON graph structure per spot for the interactive
-- production Scenario Engine (nodes → options → next_node_id).
-- One active graph per spot (spot_id is unique).

create table public.scenario_graphs (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null unique references public.spots (id) on delete cascade,
  title text not null,
  location text not null default '',
  characters jsonb not null default '[]'::jsonb,
  nodes jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.scenario_graphs enable row level security;

-- Public reads expose active graphs only; admin/service-role bypasses RLS.
create policy "scenario graphs readable when active"
  on public.scenario_graphs
  for select
  using (is_active = true);