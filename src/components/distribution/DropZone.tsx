
import React, { useState, useMemo, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrderCard } from './OrderCard';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
}

interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  driver_id?: number;
}

interface DropZoneProps {
  group: DistributionGroup;
  schedule?: DistributionSchedule;
  items: Array<{ type: 'order' | 'return'; data: Order | Return }>;
  onDrop: (scheduleId: number, item: { type: 'order' | 'return'; data: Order | Return }) => void;
  onDeleteClick: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  group,
  schedule,
  items,
  onDrop,
  onDeleteClick
}) => {
  const navigate = useNavigate();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { type: 'order' | 'return'; data: Order | Return }) => {
      if (schedule) {
        onDrop(schedule.schedule_id, item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleItemDragStart = (item: { type: 'order' | 'return'; data: Order | Return }) => {
    console.log('Item drag started from zone:', item);
  };

  const handlePrint = () => {
    if (!schedule) return;

    const orders = items
      .filter(item => item.type === 'order')
      .map(item => item.data as Order);
    
    const returns = items
      .filter(item => item.type === 'return')
      .map(item => item.data as Return);

    // Navigate to the report page with data
    const reportData = {
      scheduleId: schedule.schedule_id,
      groupName: group.separation,
      orders,
      returns,
    };

    navigate(`/zone-report/${group.groups_id}`, { state: reportData });
  };

  const totalValue = items.reduce((sum, item) => {
    const value = item.type === 'order' 
      ? (item.data as Order).totalorder || 0
      : (item.data as Return).totalreturn || 0;
    return sum + value;
  }, 0);

  return (
    <Card
      ref={drop}
      className={`min-h-[300px] transition-colors relative ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{group.separation}</CardTitle>
          <div className="flex gap-2">
            {schedule && items.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrint}
                className="h-6 w-6 text-muted-foreground hover:text-blue-600"
                title="הדפס דוח"
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {schedule && (
          <div className="text-sm text-muted-foreground">
            מזהה לוח זמנים: {schedule.schedule_id}
            <div className="font-medium text-primary">
              סה"כ ערך: ₪{totalValue.toLocaleString()}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <OrderCard
            key={`${item.type}-${item.type === 'order' ? (item.data as Order).ordernumber : (item.data as Return).returnnumber}`}
            type={item.type}
            data={item.data}
            onDragStart={handleItemDragStart}
          />
        ))}
        {items.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            גרור הזמנות או החזרות לכאן
          </div>
        )}
      </CardContent>
    </Card>
  );
};
