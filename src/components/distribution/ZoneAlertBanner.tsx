
import React from 'react';
import { Siren } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ZoneAlertBannerProps {
  isVisible: boolean;
}

export const ZoneAlertBanner: React.FC<ZoneAlertBannerProps> = ({ isVisible }) => {
  const isMobile = useIsMobile();
  
  if (!isVisible) return null;

  return (
    <div className={`flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-md ${isMobile ? 'p-2' : 'p-2'} mb-3`}>
      <Siren className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-red-600 animate-pulse`} />
      <span className={`text-red-600 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>לתשומת לב המחסן</span>
      <Siren className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-red-600 animate-pulse`} />
    </div>
  );
};
