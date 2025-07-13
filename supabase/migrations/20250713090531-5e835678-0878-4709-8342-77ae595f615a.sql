-- Add message_alert column to mainorder table
ALTER TABLE public.mainorder 
ADD COLUMN message_alert BOOLEAN DEFAULT NULL;

-- Add message_alert column to mainreturns table
ALTER TABLE public.mainreturns 
ADD COLUMN message_alert BOOLEAN DEFAULT NULL;