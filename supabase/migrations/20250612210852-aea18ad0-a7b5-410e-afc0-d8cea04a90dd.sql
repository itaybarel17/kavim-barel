
-- Add dis_number column to distribution_schedule if it doesn't exist
ALTER TABLE distribution_schedule 
ADD COLUMN IF NOT EXISTS dis_number integer;

-- Create function to get next production number for a specific date
CREATE OR REPLACE FUNCTION get_next_dis_number(production_date date)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(dis_number), 0) + 1
  INTO next_num
  FROM distribution_schedule
  WHERE distribution_date = production_date
    AND dis_number IS NOT NULL;
  
  RETURN next_num;
END;
$$;

-- Create function to mark schedule as produced and update items
CREATE OR REPLACE FUNCTION produce_schedule(schedule_id_param integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  schedule_record record;
  new_dis_number integer;
BEGIN
  -- Get the schedule record
  SELECT * INTO schedule_record
  FROM distribution_schedule
  WHERE schedule_id = schedule_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found';
  END IF;
  
  -- Get next dis_number for this date
  SELECT get_next_dis_number(schedule_record.distribution_date) INTO new_dis_number;
  
  -- Update the schedule as produced
  UPDATE distribution_schedule
  SET 
    dis_number = new_dis_number,
    done_schedule = NOW()
  WHERE schedule_id = schedule_id_param;
  
  -- Mark all orders as done
  UPDATE mainorder
  SET done_mainorder = NOW()
  WHERE schedule_id = schedule_id_param;
  
  -- Mark all returns as done
  UPDATE mainreturns
  SET done_return = NOW()
  WHERE schedule_id = schedule_id_param;
  
  RETURN new_dis_number;
END;
$$;
