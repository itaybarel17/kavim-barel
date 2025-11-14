// Utility function for consistent area colors across the application
export const getAreaColor = (areaName: string) => {
  // Extract main area name without number suffix
  const mainArea = areaName.replace(/\s+\d+$/, '').trim();
  
  const areaColors: Record<string, string> = {
    'דרום תל אביב': 'bg-blue-500 text-white',
    'צפון תל אביב': 'bg-blue-500 text-white',
    'חיפה': 'bg-green-500 text-white',
    'קריות': 'bg-green-500 text-white',
    'ירושלים': 'bg-purple-500 text-white',
    'רמת גן': 'bg-orange-500 text-white',
    'שרון דרום': 'bg-pink-500 text-white',
    'שרון צפון': 'bg-pink-500 text-white',
    'ראשון לציון': 'bg-indigo-500 text-white',
    'שפלה': 'bg-teal-500 text-white',
    'חולון-בת ים': 'bg-teal-500 text-white',
    'צפון רחוק': 'bg-red-500 text-white',
    'צפון קרוב': 'bg-cyan-500 text-white',
    'דרום': 'bg-amber-500 text-white',
    'אילת': 'bg-lime-500 text-white',
    'פתח תקווה': 'bg-violet-500 text-white',
    'חדרה': 'bg-rose-500 text-white',
    'באר שבע': 'bg-yellow-500 text-white',
    'אשדוד': 'bg-emerald-500 text-white',
    'משולש': 'bg-slate-500 text-white',
    'כרמיאל': 'bg-sky-500 text-white'
  };
  return areaColors[mainArea] || 'bg-gray-500 text-white';
};

// Helper function to extract main area name from separation string
export const getMainAreaFromSeparation = (separation: string) => {
  // Extract the main area name before the number (e.g., "תל אביב-יפו 1" -> "תל אביב-יפו")
  return separation.replace(/\s+\d+$/, '').trim();
};

// Convert Tailwind color classes to hex colors for Google Maps
export const getAreaColorHex = (areaName: string): string => {
  // Extract main area name without number suffix
  const mainArea = areaName.replace(/\s+\d+$/, '').trim();
  
  const colorMap: Record<string, string> = {
    'דרום תל אביב': '#3b82f6', // blue-500
    'צפון תל אביב': '#3b82f6', // blue-500
    'חיפה': '#22c55e', // green-500
    'קריות': '#22c55e', // green-500
    'ירושלים': '#a855f7', // purple-500
    'רמת גן': '#f97316', // orange-500
    'שרון דרום': '#ec4899', // pink-500
    'שרון צפון': '#ec4899', // pink-500
    'ראשון לציון': '#6366f1', // indigo-500
    'שפלה': '#14b8a6', // teal-500
    'חולון-בת ים': '#14b8a6', // teal-500
    'צפון רחוק': '#ef4444', // red-500
    'צפון קרוב': '#06b6d4', // cyan-500
    'דרום': '#f59e0b', // amber-500
    'אילת': '#84cc16', // lime-500
    'פתח תקווה': '#8b5cf6', // violet-500
    'חדרה': '#f43f5e', // rose-500
    'באר שבע': '#eab308', // yellow-500
    'אשדוד': '#10b981', // emerald-500
    'משולש': '#64748b', // slate-500
    'כרמיאל': '#0ea5e9' // sky-500
  };
  return colorMap[mainArea] || '#6b7280'; // gray-500
};