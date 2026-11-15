do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'direct_messages'
          and policyname = 'Senders can delete their own direct messages'
    ) then
        execute 'create policy "Senders can delete their own direct messages" on public.direct_messages for delete to authenticated using ((select auth.uid()) = sender_id)';
    end if;
end
$$;
