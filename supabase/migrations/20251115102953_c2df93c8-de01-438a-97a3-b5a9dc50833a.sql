-- Add linked_candy_customernumber column to customerlist
ALTER TABLE public.customerlist 
ADD COLUMN IF NOT EXISTS linked_candy_customernumber TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customerlist_linked_candy 
ON public.customerlist(linked_candy_customernumber) 
WHERE linked_candy_customernumber IS NOT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.customerlist.linked_candy_customernumber IS 'Links to candycustomerlist.customernumber for customers who are served by both us and the importer';
