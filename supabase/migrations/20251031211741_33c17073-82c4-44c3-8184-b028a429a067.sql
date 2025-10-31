-- Recalculate totalsupplyspots for all distribution groups
-- This field sums averagesupplyweek from cities table by area
UPDATE public.distribution_groups
SET totalsupplyspots = (
  SELECT COALESCE(SUM(c.averagesupplyweek), 0)
  FROM public.cities c
  WHERE c.area = distribution_groups.separation
)
WHERE separation IS NOT NULL;