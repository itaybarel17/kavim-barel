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

/**
 * Formats distribution days to short Hebrew day letters (ד, ה instead of רביעי, חמישי)
 */
export const formatDistributionDaysShort = (daysInput: any): string => {
  if (!daysInput) return '';
  
  // Handle string JSON format - parse it first
  let parsedInput = daysInput;
  if (typeof daysInput === 'string') {
    try {
      parsedInput = JSON.parse(daysInput);
    } catch {
      return daysInput;
    }
  }
  
  // Handle JSONB array format - flatten all values and split by commas
  if (Array.isArray(parsedInput)) {
    const allDays = parsedInput
      .filter(entry => entry && typeof entry === 'string')
      .join(',')
      .split(',')
      .map(day => day.trim())
      .filter(day => day.length > 0);
    
    return allDays.join(', ');
  }
  
  return '';
};