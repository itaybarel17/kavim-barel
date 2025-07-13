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
  
  // Handle JSONB array format like ["ד"] or ["ד","ה"] or ["ד,ה"]
  if (Array.isArray(daysInput)) {
    const daysArray: string[] = [];
    
    daysInput.forEach(dayEntry => {
      if (typeof dayEntry === 'string') {
        if (dayEntry.includes(',')) {
          // Handle comma-separated like "ד,ה"
          dayEntry.split(',').forEach(day => daysArray.push(day.trim()));
        } else {
          // Handle single letter like "ד"
          daysArray.push(dayEntry);
        }
      }
    });
    
    return daysArray
      .map(day => dayMap[day] || day)
      .join(', ');
  }
  
  return '';
};