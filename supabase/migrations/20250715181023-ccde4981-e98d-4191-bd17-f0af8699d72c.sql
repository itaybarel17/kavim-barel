-- Drop the agents_public view
DROP VIEW IF EXISTS public.agents_public CASCADE;

-- Revoke any granted permissions on the view (just in case)
REVOKE ALL ON public.agents_public FROM anon, authenticated;