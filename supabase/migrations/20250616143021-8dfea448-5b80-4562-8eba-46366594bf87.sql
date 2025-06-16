
-- כיבוי Row Level Security על טבלת agents
-- הטבלה הזו מכילה נתוני אימות ציבוריים ולא נתונים רגישים של משתמשים
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
