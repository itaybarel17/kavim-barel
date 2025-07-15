-- Enable Row Level Security on agents table
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Allow SELECT access for all users (for basic agent info like name, number)
-- This is needed for login functionality and agent display
CREATE POLICY "Enable read access for all users" 
ON public.agents 
FOR SELECT 
USING (true);

-- Restrict INSERT, UPDATE, DELETE to service_role only
-- This protects sensitive operations like password changes
CREATE POLICY "Allow all operations for service role" 
ON public.agents 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Create a public view for non-sensitive agent data
CREATE OR REPLACE VIEW public.agents_public AS
SELECT 
  id,
  agentnumber,
  agentname,
  sunday1,
  monday1,
  sunday2,
  monday2,
  tuesday1,
  tuesday2,
  wednesday1,
  wednesday2,
  thursday1,
  thursday2
FROM public.agents;

-- Grant SELECT permission on the view to all users
GRANT SELECT ON public.agents_public TO anon, authenticated;