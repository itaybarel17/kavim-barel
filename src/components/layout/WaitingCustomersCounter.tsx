
import React from 'react';
import { Users, Candy, Clock, Calendar } from 'lucide-react';
import { useWaitingCustomers } from '@/hooks/useWaitingCustomers';
import { useAuth } from '@/context/AuthContext';

export const WaitingCustomersCounter: React.FC = () => {
  const { user } = useAuth();
  const {
    data: waitingData,
    isLoading,
    error
  } = useWaitingCustomers(user?.agentnumber);

  // Get today's date in Hebrew format
  const today = new Date();
  const hebrewDate = today.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-blue-100 animate-pulse">
        <Clock className="h-3 w-3" />
        <span className="text-xs">טוען...</span>
      </div>
    );
  }

  if (error || !waitingData || !user) {
    return null;
  }

  const { regularCustomers, kandiPlusCustomers, totalCustomers } = waitingData;
  const isAdmin = user.agentnumber === "4";
  const isKandi = user.agentnumber === "99";

  if (totalCustomers === 0) {
    return (
      <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2 bg-white/10 rounded px-2 py-1 border border-white/20">
        <div className="flex items-center gap-1 text-green-200">
          <Users className="h-3 w-3" />
          <span className="text-xs font-medium">אין ממתינים 🎉</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 text-blue-200">
          <Calendar className="h-2 w-2" />
          <span className="text-xs">{hebrewDate}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2 bg-white/10 rounded px-2 py-1 border border-white/20">
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-orange-200 animate-pulse" />
        <span className="text-xs font-bold text-white">ממתינים:</span>
      </div>
      
      <div className="flex items-center gap-1 lg:gap-2">
        {/* Show Barel customers for admin and regular agents (not Kandi) */}
        {!isKandi && regularCustomers > 0 && (
          <div className="flex items-center gap-1 bg-blue-500/30 rounded px-1 py-0.5">
            <Users className="h-3 w-3 text-blue-200" />
            <span className="text-xs font-bold text-blue-100">{regularCustomers}</span>
            <span className="text-xs text-blue-200 hidden sm:inline">בראל</span>
          </div>
        )}
        
        {/* Show Kandi+ customers for admin and Kandi agents only */}
        {(isAdmin || isKandi) && kandiPlusCustomers > 0 && (
          <div className="flex items-center gap-1 bg-blue-500/30 rounded px-1 py-0.5">
            <Candy className="h-3 w-3 text-blue-200" />
            <span className="text-xs font-bold text-blue-100">{kandiPlusCustomers}</span>
            <span className="text-xs text-blue-200 hidden sm:inline">קנדי+</span>
          </div>
        )}
        
        {/* Show total only for admin */}
        {isAdmin && (
          <div className="flex items-center gap-1 bg-white/20 rounded px-1 py-0.5">
            <span className="text-xs font-bold text-white">סה"כ: {totalCustomers}</span>
          </div>
        )}
        
        {/* Date - only show on larger screens */}
        <div className="hidden lg:flex items-center gap-1 text-blue-200 border-r border-white/20 pr-2">
          <Calendar className="h-2 w-2" />
          <span className="text-xs">{hebrewDate}</span>
        </div>
      </div>
    </div>
  );
};
