/**
 * Formats distribution days from JSONB format to Hebrew days
 * Supports JSONB array format like ["ד"] or ["ד","ה"]
 */
export const formatDistributionDays = (daysInput: any): string => {
  if (!daysInput) return '';
  
  const dayMap: Record<string, string> = {
    'א': 'ראשון',
    'ב': 'שני', 
    'ג': 'שלישי',
    'ד': 'רביעי',
    'ה': 'חמישי',
    'ו': 'שישי'
  };
  
  // Handle JSONB array format like ["ד"] or ["ד","ה"]
  if (Array.isArray(daysInput)) {
    return daysInput
      .map(day => dayMap[day] || day)
      .join(', ');
  }
  
  return '';
};