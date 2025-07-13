-- Drop the existing foreign key constraint
ALTER TABLE public.messages 
DROP CONSTRAINT messages_related_to_message_id_fkey;

-- Recreate the foreign key constraint with CASCADE DELETE
ALTER TABLE public.messages 
ADD CONSTRAINT messages_related_to_message_id_fkey 
FOREIGN KEY (related_to_message_id) 
REFERENCES public.messages(messages_id) 
ON DELETE CASCADE;

-- Add comment for clarity
COMMENT ON CONSTRAINT messages_related_to_message_id_fkey ON public.messages IS 'Cascades delete to related messages when parent message is deleted';