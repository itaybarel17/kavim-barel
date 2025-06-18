
import React from 'react';
import { Siren } from 'lucide-react';

interface CentralAlertBannerProps {
  isVisible: boolean;
}

export const CentralAlertBanner: React.FC<CentralAlertBannerProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
      <Siren className="h-6 w-6 text-red-600 animate-pulse" />
      <Siren className="h-6 w-6 text-red-600 animate-pulse" />
      <Siren className="h-6 w-6 text-red-600 animate-pulse" />
      <span className="text-red-600 font-bold text-xl mx-4">לתשומת לב המחסן</span>
      <Siren className="h-6 w-6 text-red-600 animate-pulse" />
      <Siren className="h-6 w-6 text-red-600 animate-pulse" />
      <Siren className="h-6 w-6 text-red-600 animate-pulse" />
    </div>
  );
};
