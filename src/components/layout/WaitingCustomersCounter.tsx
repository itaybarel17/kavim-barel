
import React from 'react';
import { Users, Candy, Clock, Calendar } from 'lucide-react';
import { useWaitingCustomers } from '@/hooks/useWaitingCustomers';

interface WaitingCustomersCounterProps {
  currentUser?: { agentnumber: string; agentname: string };
}

export const WaitingCustomersCounter: React.FC<WaitingCustomersCounterProps> = ({ currentUser }) => {
  const { data: waitingData, isLoading, error } = useWaitingCustomers({ currentUser });

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
      <div className="flex items-center gap-2 text-blue-100 animate-pulse">
        <Clock className="h-4 w-4" />
        <span className="text-sm">טוען...</span>
      </div>
    );
  }

  if (error || !waitingData) {
    return null;
  }

  const { regularCustomers, kandiPlusCustomers, totalCustomers } = waitingData;

  if (totalCustomers === 0) {
    return (
      <div className="flex items-center gap-4 bg-white/10 rounded-lg px-3 py-2 border border-white/20">
        <div className="flex items-center gap-2 text-green-200">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">אין לקוחות ממתינים 🎉</span>
        </div>
        <div className="flex items-center gap-1 text-blue-200">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">{hebrewDate}</span>
        </div>
      </div>
    );
  }

  // Determine what to show based on user type
  const isAdmin = currentUser?.agentnumber === "4";
  const isKandiUser = currentUser?.agentnumber === "99";

  return (
    <div className="flex items-center gap-4 bg-white/10 rounded-lg px-3 py-2 border border-white/20">
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-orange-200 animate-pulse" />
        <span className="text-sm font-bold text-white">לקוחות ממתינים:</span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* For admin - show both types */}
        {isAdmin && (
          <>
            {regularCustomers > 0 && (
              <div className="flex items-center gap-1 bg-blue-500/30 rounded px-2 py-1">
                <Users className="h-4 w-4 text-blue-200" />
                <span className="text-sm font-bold text-blue-100">{regularCustomers}</span>
                <span className="text-xs text-blue-200">בראל</span>
              </div>
            )}
            
            {kandiPlusCustomers > 0 && (
              <div className="flex items-center gap-1 bg-blue-500/30 rounded px-2 py-1">
                <Candy className="h-4 w-4 text-blue-200" />
                <span className="text-sm font-bold text-blue-100">{kandiPlusCustomers}</span>
                <span className="text-xs text-blue-200">קנדי+</span>
              </div>
            )}
          </>
        )}

        {/* For Kandi+ user - show only Kandi+ */}
        {isKandiUser && kandiPlusCustomers > 0 && (
          <div className="flex items-center gap-1 bg-blue-500/30 rounded px-2 py-1">
            <Candy className="h-4 w-4 text-blue-200" />
            <span className="text-sm font-bold text-blue-100">{kandiPlusCustomers}</span>
            <span className="text-xs text-blue-200">קנדי+</span>
          </div>
        )}

        {/* For regular agents - show only regular */}
        {!isAdmin && !isKandiUser && regularCustomers > 0 && (
          <div className="flex items-center gap-1 bg-blue-500/30 rounded px-2 py-1">
            <Users className="h-4 w-4 text-blue-200" />
            <span className="text-sm font-bold text-blue-100">{regularCustomers}</span>
            <span className="text-xs text-blue-200">בראל</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
          <span className="text-sm font-bold text-white">סה"כ: {totalCustomers}</span>
        </div>
        
        <div className="flex items-center gap-1 text-blue-200 border-r border-white/20 pr-3">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">{hebrewDate}</span>
        </div>
      </div>
    </div>
  );
};
