
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, RotateCcw, User, Calendar, Printer, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getOrdersByScheduleId, 
  getReturnsByScheduleId, 
  type OrderWithSchedule, 
  type ReturnWithSchedule 
} from '@/utils/scheduleUtils';

interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  distribution_date?: string;
  destinations?: number;
  driver_id?: number;
  dis_number?: number;
  done_schedule?: string;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
}

interface Driver {
  id: number;
  nahag: string;
}

interface ProductionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  distributionSchedules: DistributionSchedule[];
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: OrderWithSchedule[];
  returns: ReturnWithSchedule[];
  onProduced?: () => void;
}

export const ProductionDialog: React.FC<ProductionDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  distributionSchedules,
  distributionGroups,
  drivers,
  orders,
  returns,
  onProduced,
  currentUser
}) => {
  const [isProducing, setIsProducing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!selectedDate) return null;

  // Check if user is admin (agent "4")
  const isAdmin = currentUser?.agentnumber === "4";

  // Build date string consistently using date components (same as CalendarGrid)
  const year = selectedDate.getFullYear();
  const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
  const day = selectedDate.getDate().toString().padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  console.log('ProductionDialog - selectedDate:', selectedDate);
  console.log('ProductionDialog - dateStr for comparison:', dateStr);
  
  const schedulesForDate = distributionSchedules.filter(
    schedule => {
      console.log('ProductionDialog - comparing schedule.distribution_date:', schedule.distribution_date, 'with dateStr:', dateStr);
      return schedule.distribution_date === dateStr;
    }
  );
  
  console.log('ProductionDialog - schedulesForDate count:', schedulesForDate.length);

  const handleProduce = async (scheduleId: number) => {
    setIsProducing(true);
    setError(null);
    
    try {
      console.log('Starting production for schedule:', scheduleId);
      
      // First, let's check if this schedule is already produced
      const schedule = distributionSchedules.find(s => s.schedule_id === scheduleId);
      if (schedule?.done_schedule) {
        throw new Error('הכרטיס כבר הופק');
      }
      
      // Get current max dis_number from the entire table (not just for this date)
      const { data: existingSchedules, error: fetchError } = await supabase
        .from('distribution_schedule')
        .select('dis_number')
        .not('dis_number', 'is', null)
        .order('dis_number', { ascending: false })
        .limit(1);
        
      if (fetchError) {
        console.error('Error fetching existing schedules:', fetchError);
        throw fetchError;
      }
      
      const nextDisNumber = existingSchedules.length > 0 ? 
        (existingSchedules[0].dis_number || 0) + 1 : 1;
  
      console.log('Next dis_number will be:', nextDisNumber);
      
      // Update the schedule with the new dis_number
      const { error: updateError } = await supabase
        .from('distribution_schedule')
        .update({ 
          dis_number: nextDisNumber,
          done_schedule: new Date().toISOString()
        })
        .eq('schedule_id', scheduleId);
        
      if (updateError) {
        console.error('Error updating schedule:', updateError);
        throw updateError;
      }
      
      // Get the orders for this schedule using our scheduleUtils
      const scheduleOrders = getOrdersByScheduleId(orders, scheduleId);
      
      if (scheduleOrders.length > 0) {
        // Extract order numbers
        const orderNumbers = scheduleOrders.map(order => order.ordernumber);
        
        // Mark orders as done
        const { error: ordersError } = await supabase
          .from('mainorder')
          .update({ done_mainorder: new Date().toISOString() })
          .in('ordernumber', orderNumbers);
          
        if (ordersError) {
          console.error('Error updating orders:', ordersError);
          // Continue even if this fails - it's not critical
        }
      }
      
      // Get returns for this schedule using our scheduleUtils
      const scheduleReturns = getReturnsByScheduleId(returns, scheduleId);
      
      if (scheduleReturns.length > 0) {
        // Extract return numbers
        const returnNumbers = scheduleReturns.map(returnItem => returnItem.returnnumber);
        
        // Mark returns as done
        const { error: returnsError } = await supabase
          .from('mainreturns')
          .update({ done_return: new Date().toISOString() })
          .in('returnnumber', returnNumbers);
          
        if (returnsError) {
          console.error('Error updating returns:', returnsError);
          // Continue even if this fails - it's not critical
        }
      }

      console.log('Production completed with dis_number:', nextDisNumber);
      
      // Call the onProduced callback to refresh data without reloading the page
      if (onProduced) {
        onProduced();
      }
      
      setShowConfirmation(null);
      onClose();
    } catch (error) {
      console.error('Error producing schedule:', error);
      setError(error instanceof Error ? error.message : 'שגיאה בהפקת הכרטיס');
    } finally {
      setIsProducing(false);
    }
  };

  const handleViewSummary = (scheduleId: number) => {
    navigate(`/production-summary/${scheduleId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            הפקה ליום {selectedDate?.toLocaleDateString('he-IL')}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">שגיאה:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {schedulesForDate.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              אין קווי חלוקה מתוזמנים ליום זה
            </div>
          ) : (
            schedulesForDate.map((schedule) => {
              const group = distributionGroups.find(g => g.groups_id === schedule.groups_id);
              const driver = drivers.find(d => d.id === schedule.driver_id);
              
              // Get orders and returns for this schedule using our scheduleUtils
              const scheduleOrders = getOrdersByScheduleId(orders, schedule.schedule_id);
              const scheduleReturns = getReturnsByScheduleId(returns, schedule.schedule_id);
              
              const stats = {
                ordersCount: scheduleOrders.length,
                returnsCount: scheduleReturns.length,
                totalValue: scheduleOrders.reduce((sum, order) => sum + (order.totalorder || 0), 0) -
                           scheduleReturns.reduce((sum, returnItem) => sum + (returnItem.totalreturn || 0), 0)
              };
              
              // Check if produced based on done_schedule timestamp
              const isProduced = schedule.done_schedule != null;
              // Check if driver is assigned
              const hasDriver = schedule.driver_id != null && driver != null;

              return (
                <Card key={schedule.schedule_id} className={`${isProduced ? 'bg-green-50 border-green-200 border-2' : 'bg-white'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-lg">
                          {group?.separation || `קו ${schedule.schedule_id}`} - מזהה: {schedule.schedule_id}
                        </div>
                        {isProduced && (
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium border border-green-300">
                            הופק #{schedule.dis_number || 'לא ידוע'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        {driver?.nahag || 'לא מוגדר נהג'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Package className="h-4 w-4" />
                        {stats.ordersCount} הזמנות
                      </div>
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <RotateCcw className="h-4 w-4" />
                        {stats.returnsCount} החזרות
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        {/* Always show view summary button */}
                        <Button
                          onClick={() => handleViewSummary(schedule.schedule_id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Printer className="h-4 w-4" />
                          הדפס דוח
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        {isProduced ? (
                          <span className="text-gray-500 text-sm font-medium px-3 py-1 bg-gray-100 rounded">
                            הופק
                          </span>
                        ) : (
                          <>
                            {/* Only show production controls to admin */}
                            {isAdmin && (
                              <>
                                {!hasDriver && (
                                  <div className="text-red-600 text-sm font-medium">
                                    יש להגדיר נהג לפני הפקה
                                  </div>
                                )}
                                <Button
                                  onClick={() => setShowConfirmation(schedule.schedule_id)}
                                  disabled={isProducing || !hasDriver}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                                >
                                  הפק
                                </Button>
                              </>
                            )}
                            {/* Show message for regular agents that they can't produce */}
                            {!isAdmin && (
                              <span className="text-gray-500 text-sm font-medium">
                                רק מנהל יכול להפיק
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Only show confirmation dialog to admin */}
                    {isAdmin && showConfirmation === schedule.schedule_id && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-center mb-3">
                          <div className="font-medium text-yellow-800">האם להפיק קו חלוקה זה?</div>
                          <div className="text-sm text-yellow-600 mt-1">
                            פעולה זו תסמן את כל ההזמנות והחזרות כמופקות
                          </div>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => handleProduce(schedule.schedule_id)}
                            disabled={isProducing || !hasDriver}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                          >
                            {isProducing ? 'מפיק...' : 'כן, הפק'}
                          </Button>
                          <Button
                            onClick={() => setShowConfirmation(null)}
                            disabled={isProducing}
                            variant="outline"
                            size="sm"
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
