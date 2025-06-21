
-- Check current structure and update only what's needed
-- First, let's try to add the enum value for distribution line
DO $$ 
BEGIN
    -- Try to add the enum value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'קו הפצה' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subject_message')
    ) THEN
        ALTER TYPE public.subject_message ADD VALUE 'קו הפצה';
    END IF;
END $$;

-- Make subject nullable for distribution line messages
ALTER TABLE public.messages 
ALTER COLUMN subject DROP NOT NULL;

-- Add foreign key constraint for schedule_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_messages_schedule_id'
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT fk_messages_schedule_id 
        FOREIGN KEY (schedule_id) REFERENCES public.distribution_schedule(schedule_id);
    END IF;
END $$;
