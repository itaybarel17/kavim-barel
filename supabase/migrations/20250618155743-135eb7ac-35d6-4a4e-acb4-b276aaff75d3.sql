
-- Add alert_status column to mainorder table
ALTER TABLE mainorder 
ADD COLUMN alert_status boolean DEFAULT false;

-- Add alert_status column to mainreturns table  
ALTER TABLE mainreturns 
ADD COLUMN alert_status boolean DEFAULT false;
