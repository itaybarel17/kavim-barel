-- Add city column to messages table to support "order on another customer" functionality
ALTER TABLE public.messages ADD COLUMN city TEXT;