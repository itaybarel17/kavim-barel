
import React from 'react';
import { Siren } from 'lucide-react';

interface ZoneAlertBannerProps {
  schedule: any;
  onToggleAlert: (orderId: number, currentStatus: boolean) => void;
}

export const ZoneAlertBanner: React.FC<ZoneAlertBannerProps> = ({ schedule, onToggleAlert }) => {
  const hasAlerts = schedule.mainorder?.some((order: any) => order.alert_status) ||
                   schedule.mainreturns?.some((returnItem: any) => returnItem.alert_status);

  if (!hasAlerts) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-md p-2 mb-3">
      <Siren className="h-4 w-4 text-red-600 animate-pulse" />
      <span className="text-red-600 font-bold text-sm">לתשומת לב המחסן</span>
      <Siren className="h-4 w-4 text-red-600 animate-pulse" />
    </div>
  );
};
