import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, RotateCcw, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ArchivedOrder {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  done_mainorder: string;
  schedule_id: number;
}

interface ArchivedReturn {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  done_return: string;
  schedule_id: number;
}

interface DeletedOrder {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  ordercancel: string;
  schedule_id: number;
}

interface DeletedReturn {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  returncancel: string;
  schedule_id: number;
}

const Archive = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch archived orders
  const { data: archivedOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['archived-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, done_mainorder, schedule_id')
        .not('done_mainorder', 'is', null)
        .order('done_mainorder', { ascending: false });
      
      if (error) throw error;
      return data as ArchivedOrder[];
    }
  });

  // Fetch archived returns
  const { data: archivedReturns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ['archived-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, done_return, schedule_id')
        .not('done_return', 'is', null)
        .order('done_return', { ascending: false });
      
      if (error) throw error;
      return data as ArchivedReturn[];
    }
  });

  // Fetch deleted orders
  const { data: deletedOrders = [], refetch: refetchDeletedOrders, isLoading: deletedOrdersLoading } = useQuery({
    queryKey: ['deleted-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, ordercancel, schedule_id')
        .not('ordercancel', 'is', null)
        .order('ordercancel', { ascending: false });
      
      if (error) throw error;
      return data as DeletedOrder[];
    }
  });

  // Fetch deleted returns
  const { data: deletedReturns = [], refetch: refetchDeletedReturns, isLoading: deletedReturnsLoading } = useQuery({
    queryKey: ['deleted-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, returncancel, schedule_id')
        .not('returncancel', 'is', null)
        .order('returncancel', { ascending: false });
      
      if (error) throw error;
      return data as DeletedReturn[];
    }
  });

  const handleRestoreOrder = async (order: DeletedOrder) => {
    try {
      const { error } = await supabase
        .from('mainorder')
        .update({ ordercancel: null })
        .eq('ordernumber', order.ordernumber);
      
      if (error) throw error;
      
      toast({
        title: "הזמנה שוחזרה",
        description: `הזמנה #${order.ordernumber} חזרה לממשק ההפצה`,
      });
      refetchDeletedOrders();
    } catch (error) {
      console.error('Error restoring order:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשחזור ההזמנה",
        variant: "destructive",
      });
    }
  };

  const handleRestoreReturn = async (returnItem: DeletedReturn) => {
    try {
      const { error } = await supabase
        .from('mainreturns')
        .update({ returncancel: null })
        .eq('returnnumber', returnItem.returnnumber);
      
      if (error) throw error;
      
      toast({
        title: "החזרה שוחזרה",
        description: `החזרה #${returnItem.returnnumber} חזרה לממשק ההפצה`,
      });
      refetchDeletedReturns();
    } catch (error) {
      console.error('Error restoring return:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשחזור ההחזרה",
        variant: "destructive",
      });
    }
  };

  // Filter items based on search term
  const filteredOrders = archivedOrders.filter(order =>
    order.customername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.ordernumber.toString().includes(searchTerm)
  );

  const filteredReturns = archivedReturns.filter(returnItem =>
    returnItem.customername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnItem.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnItem.returnnumber.toString().includes(searchTerm)
  );

  const filteredDeletedOrders = deletedOrders.filter(order =>
    order.customername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.ordernumber.toString().includes(searchTerm)
  );

  const filteredDeletedReturns = deletedReturns.filter(returnItem =>
    returnItem.customername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnItem.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnItem.returnnumber.toString().includes(searchTerm)
  );

  const isLoading = ordersLoading || returnsLoading || deletedOrdersLoading || deletedReturnsLoading;

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/distribution')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            חזור לממשק הפצה
          </Button>
          <h1 className="text-3xl font-bold">ארכיון הזמנות והחזרות</h1>
        </div>
      </div>

      {/* Search input */}
      <div className="mb-6">
        <Input
          placeholder="חיפוש לפי שם לקוח, עיר או מספר הזמנה..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">טוען נתוני ארכיון...</div>
      ) : (
        <div className="space-y-6">
          {/* Deleted Items Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deleted Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  הזמנות מחוקות ({filteredDeletedOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredDeletedOrders.map((order) => (
                    <div
                      key={order.ordernumber}
                      className="p-3 border border-gray-300 rounded-lg bg-gray-50 flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-800">
                            #{order.ordernumber}
                          </div>
                          <div className="text-sm text-gray-600 font-bold">
                            ₪{order.totalorder?.toLocaleString('he-IL')}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <div>{order.customername}</div>
                          <div>{order.address}, {order.city}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            נמחק: {new Date(order.ordercancel).toLocaleDateString('he-IL')} {new Date(order.ordercancel).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreOrder(order)}
                        className="ml-2 flex items-center gap-1"
                        title="שחזר הזמנה"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {filteredDeletedOrders.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      אין הזמנות מחוקות
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Deleted Returns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  החזרות מחוקות ({filteredDeletedReturns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredDeletedReturns.map((returnItem) => (
                    <div
                      key={returnItem.returnnumber}
                      className="p-3 border border-gray-300 rounded-lg bg-gray-50 flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-800">
                            החזרה #{returnItem.returnnumber}
                          </div>
                          <div className="text-sm text-gray-600 font-bold">
                            ₪{returnItem.totalreturn?.toLocaleString('he-IL')}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <div>{returnItem.customername}</div>
                          <div>{returnItem.address}, {returnItem.city}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            נמחק: {new Date(returnItem.returncancel).toLocaleDateString('he-IL')} {new Date(returnItem.returncancel).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreReturn(returnItem)}
                        className="ml-2 flex items-center gap-1"
                        title="שחזר החזרה"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {filteredDeletedReturns.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      אין החזרות מחוקות
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Archived Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                הזמנות מופקות ({filteredOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredOrders.map((order) => (
                  <div
                    key={order.ordernumber}
                    className="p-3 border border-green-200 rounded-lg bg-green-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-green-800">
                        הזמנה #{order.ordernumber}
                      </div>
                      <div className="text-sm text-green-600 font-bold">
                        ₪{order.totalorder?.toLocaleString('he-IL')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div>{order.customername}</div>
                      <div>{order.address}, {order.city}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        הופק: {new Date(order.done_mainorder).toLocaleDateString('he-IL')} {new Date(order.done_mainorder).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    אין הזמנות מופקות
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Archived Returns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                החזרות מופקות ({filteredReturns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredReturns.map((returnItem) => (
                  <div
                    key={returnItem.returnnumber}
                    className="p-3 border border-red-200 rounded-lg bg-red-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-red-800">
                        החזרה #{returnItem.returnnumber}
                      </div>
                      <div className="text-sm text-red-600 font-bold">
                        ₪{returnItem.totalreturn?.toLocaleString('he-IL')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div>{returnItem.customername}</div>
                      <div>{returnItem.address}, {returnItem.city}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        הופק: {new Date(returnItem.done_return).toLocaleDateString('he-IL')} {new Date(returnItem.done_return).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredReturns.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    אין החזרות מופקות
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Archive;
