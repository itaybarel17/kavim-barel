
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummarySectionProps {
  zoneNumber: number;
  numberedOrdersCount: number;
  returnsCount: number;
  totalOrdersAmount: number;
  totalReturnsAmount: number;
  netTotal: number;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  zoneNumber,
  numberedOrdersCount,
  returnsCount,
  totalOrdersAmount,
  totalReturnsAmount,
  netTotal
}) => {
  return (
    <Card className="border-green-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-green-800">
          סיכום אזור {zoneNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-blue-700 p-2 border border-blue-300 rounded">
            <div className="font-medium">סך הכל הזמנות:</div>
            <div>{numberedOrdersCount} פריטים ממוספרים</div>
            <div className="font-bold">₪{totalOrdersAmount.toLocaleString('he-IL')}</div>
          </div>
          <div className="text-red-700 p-2 border border-red-300 rounded">
            <div className="font-medium">סך הכל החזרות:</div>
            <div>{returnsCount} פריטים</div>
            <div className="font-bold">₪{totalReturnsAmount.toLocaleString('he-IL')}</div>
          </div>
          <div className="text-green-800 p-2 border border-green-400 rounded">
            <div className="font-medium">סך הכל נטו:</div>
            <div className="font-bold text-sm">₪{netTotal.toLocaleString('he-IL')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
