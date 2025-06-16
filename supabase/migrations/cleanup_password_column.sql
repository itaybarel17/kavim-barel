
-- מחיקת עמודת הסיסמה הישנה לאחר המעבר להצפנה
ALTER TABLE public.agents 
DROP COLUMN IF EXISTS password_onlyview;
