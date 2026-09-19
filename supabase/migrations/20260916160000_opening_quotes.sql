-- opening_quotes — dynamic opening-story quotes (managed from the admin panel)

-- ----------------------------------------------------------------- tables
create table if not exists public.opening_quotes (
  id         uuid primary key default gen_random_uuid(),
  text_ar    text not null,
  text_en    text not null,
  is_active  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists opening_quotes_active_sort_idx
  on public.opening_quotes (is_active, sort_order, created_at);

insert into public.opening_quotes (text_ar, text_en, sort_order) values
  ('بغداد بيها حجي.. وسوالف ماتنحجي', 'Baghdad never runs out of talk — never. But the realest stories? No cap... those don''t get told. They just live in you. Lowkey, that''s what hits different. Real ones know.', 0),
  ('لكل شارع في بغداد حكاية تنتظر من يسمعها', 'Every street in Baghdad has a story waiting to be heard.', 10),
  ('السفر الحقيقي يبدأ حين تعرف المدينة بعيون أهلها', 'Real travel begins when the city opens its doors to you.', 20),
  ('لا تكتفِ بالزيارة… عِش معنا يومًا بغداديًّا', 'Don''t just visit — live a Baghdad day with us.', 30),
  ('الطيبة لغة… والكلام أهله. تعال نتعرف', 'Kindness is a language spoken freely here. Come meet us.', 40),
  ('الدفتر ورق، لكن الرحلة تكتبها أنت', 'The notebook is just paper — you write the journey.', 50)
on conflict (id) do nothing;

-- ------------------------------------------------------------------- RLS
alter table public.opening_quotes enable row level security;

grant usage on schema public to anon, authenticated;

drop policy if exists "opening quotes readable when active" on public.opening_quotes;
create policy "opening quotes readable when active"
  on public.opening_quotes for select to anon, authenticated
  using (is_active = true);

commit;