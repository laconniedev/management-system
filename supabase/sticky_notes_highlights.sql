-- Sticky notes: remember which words are highlighted on each note.
-- Run once in Supabase → SQL Editor. Safe: only adds a column and a trigger; no data is changed.

alter table public.sticky_notes
  add column if not exists highlights jsonb not null default '[]'::jsonb;

alter table public.sticky_notes
  drop constraint if exists sticky_notes_highlights_is_array;
alter table public.sticky_notes
  add constraint sticky_notes_highlights_is_array
  check (jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) <= 150);

drop trigger if exists sticky_notes_set_updated_at on public.sticky_notes;
create trigger sticky_notes_set_updated_at
  before update on public.sticky_notes
  for each row execute function public.set_updated_at();
