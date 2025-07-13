/**
 * Formats distribution days from ["ד,ה"] format to "רביעי, חמישי"
 */
export const formatDistributionDays = (daysArray: string[] | null | undefined): string => {
  if (!daysArray || !Array.isArray(daysArray)) return '';
  
  const dayMap: Record<string, string> = {
    'א': 'ראשון',
    'ב': 'שני', 
    'ג': 'שלישי',
    'ד': 'רביעי',
    'ה': 'חמישי',
    'ו': 'שישי'
  };
  
  // Process each array entry which might contain multiple days
  const allDays: string[] = [];
  daysArray.forEach(dayEntry => {
    // Each dayEntry might be multiple letters separated by commas
    const individualDays = dayEntry.split(',').map(d => d.trim());
    allDays.push(...individualDays);
  });
  
  // Map to full names and join
  return allDays
    .map(day => dayMap[day] || day)
    .join(', ');
};