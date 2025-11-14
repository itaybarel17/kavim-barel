-- Add set_aside boolean field to mainorder table
ALTER TABLE mainorder ADD COLUMN set_aside boolean DEFAULT false;