/**
 * Formats distribution days from database format to Hebrew days
 * Supports both array format ["ד,ה"] and string format "{ד, ה}"
 */
export const formatDistributionDays = (daysInput: string[] | string | null | undefined): string => {
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
  
  // Handle string format like "{ד, ה}"
  if (typeof daysInput === 'string') {
    // Remove curly braces and split by comma
    const cleaned = daysInput.replace(/[{}]/g, '').trim();
    if (cleaned) {
      daysArray = cleaned.split(',').map(d => d.trim());
    }
  }
  // Handle array format like ["ד,ה"]
  else if (Array.isArray(daysInput)) {
    daysInput.forEach(dayEntry => {
      const individualDays = dayEntry.split(',').map(d => d.trim());
      daysArray.push(...individualDays);
    });
  }
  
  // Map to full names and join
  return daysArray
    .map(day => dayMap[day] || day)
    .join(', ');
};