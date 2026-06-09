
create table if not exists public.shop_prices (
  kind text primary key,
  price numeric not null default 0
);

alter table public.shop_prices enable row level security;

create policy "Anyone can read shop prices"
  on public.shop_prices for select
  using (true);

create policy "Super admins can update shop prices"
  on public.shop_prices for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

insert into public.shop_prices (kind, price) values
  ('jersey', 45),
  ('cap', 18),
  ('bottle', 14),
  ('armband', 9)
on conflict (kind) do nothing;
;
