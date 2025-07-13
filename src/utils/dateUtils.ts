/**
 * Formats distribution days from JSONB format to Hebrew days
 * Supports JSONB array format like ["א,ג"] or ["א", "ג"]
 */
export const formatDistributionDays = (daysInput: any): string => {
  console.log('🔍 formatDistributionDays - INPUT:', daysInput, 'Type:', typeof daysInput);
  
  if (!daysInput) {
    console.log('❌ formatDistributionDays - No input provided');
    return '';
  }
  
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
    console.log('✅ formatDistributionDays - Input is array:', daysInput);
    daysInput.forEach((dayEntry, index) => {
      console.log(`   Processing element ${index}:`, dayEntry, 'Type:', typeof dayEntry);
      if (typeof dayEntry === 'string') {
        // Handle entries like "א,ג" or single letters like "ה"
        const individualDays = dayEntry.split(',').map(d => d.trim());
        console.log(`   Split result:`, individualDays);
        daysArray.push(...individualDays);
      }
    });
  } else {
    console.log('❌ formatDistributionDays - Input is not array');
  }
  
  console.log('📋 formatDistributionDays - Final daysArray:', daysArray);
  
  // Map to full names and join
  const result = daysArray
    .map(day => {
      const mapped = dayMap[day] || day;
      console.log(`   Mapping '${day}' -> '${mapped}'`);
      return mapped;
    })
    .join(', ');
  
  console.log('🎯 formatDistributionDays - RESULT:', result);
  return result;
};