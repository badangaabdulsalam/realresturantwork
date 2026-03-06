-- Run this in Supabase SQL Editor before setting STATE_BACKEND=supabase
create table if not exists public.app_state (
    key text primary key,
    value jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

create or replace function public.touch_app_state_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists app_state_touch_updated_at on public.app_state;
create trigger app_state_touch_updated_at
before update on public.app_state
for each row
execute function public.touch_app_state_updated_at();
