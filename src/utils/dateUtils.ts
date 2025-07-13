/**
 * Formats distribution days from JSONB format to Hebrew days
 * Supports JSONB array format like ["א,ג"] or ["א", "ג"]
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
  
  let daysArray: string[] = [];
  
  // Handle JSONB array format - each element can be comma-separated letters
  if (Array.isArray(daysInput)) {
    daysInput.forEach(dayEntry => {
      if (typeof dayEntry === 'string') {
        // Handle entries like "א,ג" or single letters like "ה"
        const individualDays = dayEntry.split(',').map(d => d.trim());
        daysArray.push(...individualDays);
      }
    });
  }
  
  // Map to full names and join
  return daysArray
    .map(day => dayMap[day] || day)
    .join(', ');
};