
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportHeaderProps {
  zoneNumber: number;
  scheduleId: number;
  groupName: string;
  driverName: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  zoneNumber,
  scheduleId,
  groupName,
  driverName
}) => {
  return (
    <Card className="mb-3 border">
      <CardHeader className="pb-2">
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-lg font-bold text-primary">
              דוח אזור {zoneNumber}
            </CardTitle>
            {groupName && groupName !== 'לא מוגדר' && (
              <span className="text-lg font-bold text-primary">
                {groupName}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="font-medium">מזהה לוח זמנים:</span> {scheduleId}
          </div>
          <div>
            <span className="font-medium">נהג:</span> {driverName || 'לא מוגדר'}
          </div>
          <div>
            <span className="font-medium">תאריך הדפסה:</span>{' '}
            {new Date().toLocaleDateString('he-IL')}
          </div>
          <div>
            <span className="font-medium">שעת הדפסה:</span>{' '}
            {new Date().toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
