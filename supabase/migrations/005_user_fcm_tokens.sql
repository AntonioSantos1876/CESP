create table if not exists public.user_fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  constraint user_fcm_tokens_token_unique unique (token)
);

alter table public.user_fcm_tokens enable row level security;

create policy "Users can manage own tokens"
  on public.user_fcm_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_fcm_tokens_user_id_idx on public.user_fcm_tokens (user_id);
