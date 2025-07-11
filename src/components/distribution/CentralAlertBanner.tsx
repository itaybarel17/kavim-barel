
import React from 'react';
import { Siren } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CentralAlertBannerProps {
  isVisible: boolean;
}

export const CentralAlertBanner: React.FC<CentralAlertBannerProps> = ({ isVisible }) => {
  const isMobile = useIsMobile();
  
  if (!isVisible) return null;

  return (
    <div className={`flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-3'} bg-red-50 border-2 border-red-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} mb-6`}>
      <Siren className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-red-600 animate-pulse`} />
      {!isMobile && <Siren className="h-6 w-6 text-red-600 animate-pulse" />}
      <Siren className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-red-600 animate-pulse`} />
      <span className={`text-red-600 font-bold ${isMobile ? 'text-sm mx-2' : 'text-xl mx-4'}`}>לתשומת לב המחסן</span>
      <Siren className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-red-600 animate-pulse`} />
      {!isMobile && <Siren className="h-6 w-6 text-red-600 animate-pulse" />}
      <Siren className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-red-600 animate-pulse`} />
    </div>
  );
};
