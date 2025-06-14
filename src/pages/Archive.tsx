
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, RotateCcw, Undo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ArchivedOrder {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  done_mainorder: string | null;
  schedule_id: number;
  ordercancel?: string | null;
}

interface ArchivedReturn {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  done_return: string | null;
  schedule_id: number;
  returncancel?: string | null;
}

const Archive = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [restoring, setRestoring] = useState<{ type: 'order' | 'return'; num: number } | null>(null);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const navigate = useNavigate();

  // Fetch regular archived orders (done_mainorder not null, not ordercancel)
  const { data: archivedOrders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['archived-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, done_mainorder, schedule_id, ordercancel')
        .not('done_mainorder', 'is', null)
        .is('ordercancel', null)
        .order('done_mainorder', { ascending: false });
      if (error) throw error;
      return data as ArchivedOrder[];
    }
  });

  // Fetch regular archived returns (done_return not null, not returncancel)
  const { data: archivedReturns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ['archived-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, done_return, schedule_id, returncancel')
        .not('done_return', 'is', null)
        .is('returncancel', null)
        .order('done_return', { ascending: false });
      if (error) throw error;
      return data as ArchivedReturn[];
    }
  });

  // Fetch deleted/canceled orders
  const { data: deletedOrders = [], isLoading: deletedOrdersLoading } = useQuery({
    queryKey: ['deleted-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, done_mainorder, schedule_id, ordercancel')
        .not('ordercancel', 'is', null)
        .order('ordercancel', { ascending: false });
      if (error) throw error;
      return data as ArchivedOrder[];
    }
  });

  // Fetch deleted/canceled returns
  const { data: deletedReturns = [], isLoading: deletedReturnsLoading } = useQuery({
    queryKey: ['deleted-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, done_return, schedule_id, returncancel')
        .not('returncancel', 'is', null)
        .order('returncancel', { ascending: false });
      if (error) throw error;
      return data as ArchivedReturn[];
    }
  });

  // Filter items based on search term for all sections
  const filterBySearch = <T extends { customername?: string; city?: string; ordernumber?: number; returnnumber?: number }>(
    items: T[]
  ) => {
    return items.filter(item =>
      (item.customername?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.city?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (typeof item.ordernumber === "number" && item.ordernumber.toString().includes(searchTerm)) ||
      (typeof item.returnnumber === "number" && item.returnnumber.toString().includes(searchTerm))
    );
  };

  const filteredOrders = filterBySearch(archivedOrders);
  const filteredReturns = filterBySearch(archivedReturns);
  const filteredDeletedOrders = filterBySearch(deletedOrders);
  const filteredDeletedReturns = filterBySearch(deletedReturns);

  const isLoading = ordersLoading || returnsLoading || deletedOrdersLoading || deletedReturnsLoading;

  // Restore logic
  async function handleRestore(type: 'order' | 'return', num: number) {
    setRestoring({ type, num });
    setLoadingRestore(true);
    if (type === 'order') {
      const { error } = await supabase
        .from('mainorder')
        .update({ ordercancel: null })
        .eq('ordernumber', num);
      if (error) {
        setLoadingRestore(false);
        alert('שגיאה בשחזור ההזמנה');
        return;
      }
    } else {
      const { error } = await supabase
        .from('mainreturns')
        .update({ returncancel: null })
        .eq('returnnumber', num);
      if (error) {
        setLoadingRestore(false);
        alert('שגיאה בשחזור ההחזרה');
        return;
      }
    }
    setLoadingRestore(false);
    setRestoring(null);
    refetch(); // refresh regular orders display after restore
  }

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
            חזור למממשק הפצה
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        #{order.ordernumber}
                      </div>
                      <div className="text-sm text-green-600 font-bold">
                        ₪{order.totalorder?.toLocaleString('he-IL')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div>{order.customername}</div>
                      <div>{order.address}, {order.city}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        הופק: {order.done_mainorder
                          ? new Date(order.done_mainorder).toLocaleDateString('he-IL')
                          : ""}
                        {order.done_mainorder && (
                          <>
                            {" "}
                            {new Date(order.done_mainorder).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </>
                        )}
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
                        #{returnItem.returnnumber}
                      </div>
                      <div className="text-sm text-red-600 font-bold">
                        ₪{returnItem.totalreturn?.toLocaleString('he-IL')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div>{returnItem.customername}</div>
                      <div>{returnItem.address}, {returnItem.city}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        הופק: {returnItem.done_return
                          ? new Date(returnItem.done_return).toLocaleDateString('he-IL')
                          : ""}
                        {returnItem.done_return && (
                          <>
                            {" "}
                            {new Date(returnItem.done_return).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </>
                        )}
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

      {/* Deleted/archived ORDERS - with restore */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5" />
              הזמנות מחוקות ({filteredDeletedOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDeletedOrders.map((order) => (
                <div
                  key={order.ordernumber}
                  className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium text-gray-800">#{order.ordernumber}</div>
                    <div className="text-sm text-gray-700">
                      <div>{order.customername}</div>
                      <div>{order.address}, {order.city}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {/* Deleted on: */}
                        נמחק: {order.ordercancel
                          ? new Date(order.ordercancel).toLocaleDateString('he-IL')
                          : ""}
                        {order.ordercancel && (
                          <>
                            {" "}
                            {new Date(order.ordercancel).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={loadingRestore && restoring?.type === "order" && restoring.num === order.ordernumber}
                    onClick={() => handleRestore('order', order.ordernumber)}
                    aria-label="שחזר"
                    title="שחזר הזמנה"
                  >
                    <Undo className="w-4 h-4" />
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

        {/* Deleted/archived RETURNS - with restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5" />
              החזרות מחוקות ({filteredDeletedReturns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDeletedReturns.map((retItem) => (
                <div
                  key={retItem.returnnumber}
                  className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium text-gray-800">#{retItem.returnnumber}</div>
                    <div className="text-sm text-gray-700">
                      <div>{retItem.customername}</div>
                      <div>{retItem.address}, {retItem.city}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        נמחק: {retItem.returncancel
                          ? new Date(retItem.returncancel).toLocaleDateString('he-IL')
                          : ""}
                        {retItem.returncancel && (
                          <>
                            {" "}
                            {new Date(retItem.returncancel).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={loadingRestore && restoring?.type === "return" && restoring.num === retItem.returnnumber}
                    onClick={() => handleRestore('return', retItem.returnnumber)}
                    aria-label="שחזר"
                    title="שחזר החזרה"
                  >
                    <Undo className="w-4 h-4" />
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

    </div>
  );
};

export default Archive;
