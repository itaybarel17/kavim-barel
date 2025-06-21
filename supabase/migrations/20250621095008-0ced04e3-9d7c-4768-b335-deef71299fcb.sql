
-- First check if the subject_message enum exists and add the new value
DO $$ 
BEGIN
    -- Try to add the enum value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'מחסן' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subject_message')
    ) THEN
        ALTER TYPE public.subject_message ADD VALUE 'מחסן';
    END IF;
END $$;
