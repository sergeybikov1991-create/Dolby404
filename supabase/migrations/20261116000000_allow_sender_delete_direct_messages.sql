create policy "Senders can delete their own direct messages"
on public.direct_messages
for delete
to authenticated
using ((select auth.uid()) = sender_id);
