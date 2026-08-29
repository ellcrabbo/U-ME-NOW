-- =====================================================================
-- U, ME, NOW — 0005 realtime
-- Enable realtime for chat messages only.
-- =====================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then
    null;
  end;
end $$;
