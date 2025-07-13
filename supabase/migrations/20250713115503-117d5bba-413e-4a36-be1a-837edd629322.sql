-- Add support for multiple item associations in messages
-- Add related_to_message_id to link messages together
ALTER TABLE public.messages 
ADD COLUMN related_to_message_id bigint REFERENCES public.messages(messages_id);

-- Add index for performance
CREATE INDEX idx_messages_related_to ON public.messages(related_to_message_id);

-- Add comment for clarity
COMMENT ON COLUMN public.messages.related_to_message_id IS 'Links related messages together - child messages reference the parent message ID';