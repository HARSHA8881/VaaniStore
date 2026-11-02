-- Supabase grants EXECUTE on new functions to the `anon` role by default, so
-- "revoke ... from public" in 0001 wasn't enough: logged-out visitors could ask
-- whether any shop link (even an unpublished one) is taken. Login-only now.
revoke execute on function public.is_slug_available(text) from anon;
grant execute on function public.is_slug_available(text) to authenticated;
