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
  
  // Handle JSONB array format - each element is a single letter
  if (Array.isArray(daysInput)) {
    daysInput.forEach(dayEntry => {
      if (typeof dayEntry === 'string') {
        // Each entry is already a single letter like "ד" or "א"
        daysArray.push(dayEntry.trim());
      }
    });
  }
  
  // Map to full names and join
  return daysArray
    .map(day => dayMap[day] || day)
    .join(', ');
};