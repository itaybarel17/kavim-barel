// Utility function for consistent area colors across the application
export const getAreaColor = (areaName: string) => {
  const areaColors: Record<string, string> = {
    'תל אביב-יפו': 'bg-blue-500 text-white',
    'חיפה-קריות': 'bg-green-500 text-white', 
    'ירושלים': 'bg-purple-500 text-white',
    'רמת גן': 'bg-orange-500 text-white',
    'שרון': 'bg-pink-500 text-white',
    'ראשון לציון': 'bg-indigo-500 text-white',
    'שפלה': 'bg-teal-500 text-white',
    'צפון רחוק': 'bg-red-500 text-white',
    'צפון קרוב': 'bg-cyan-500 text-white',
    'דרום': 'bg-amber-500 text-white',
    'אילת': 'bg-lime-500 text-white',
    'פתח תקווה': 'bg-violet-500 text-white',
    'חדרה': 'bg-rose-500 text-white',
    'באר שבע': 'bg-yellow-500 text-white',
    'אשדוד': 'bg-emerald-500 text-white',
    'משולש': 'bg-slate-500 text-white'
  };
  return areaColors[areaName] || 'bg-gray-500 text-white';
};

// Helper function to extract main area name from separation string
export const getMainAreaFromSeparation = (separation: string) => {
  // Extract the main area name before the number (e.g., "תל אביב-יפו 1" -> "תל אביב-יפו")
  return separation.replace(/\s+\d+$/, '').trim();
};