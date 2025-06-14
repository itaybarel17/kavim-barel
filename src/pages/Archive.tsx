
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Package, RotateCcw, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ArchivedOrder {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  done_mainorder: string;
  agentnumber?: string;
  invoicenumber?: number;
  invoicedate?: string;
  distribution_date?: string;
  dis_number?: number;
  schedule_id?: number;
  nahag_name?: string;
}

interface ArchivedReturn {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  done_return: string;
  agentnumber?: string;
  distribution_date?: string;
  dis_number?: number;
  schedule_id?: number;
  nahag_name?: string;
}

const Archive = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Fetch archived orders with driver names
  const { data: archivedOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['archived-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select(`
          ordernumber,
          customername,
          address,
          city,
          totalorder,
          done_mainorder,
          agentnumber,
          invoicenumber,
          invoicedate,
          schedule_id,
          distribution_schedule!inner(
            distribution_date,
            dis_number,
            nahag_name
          )
        `)
        .not('done_mainorder', 'is', null)
        .order('done_mainorder', { ascending: false });
      
      if (error) throw error;
      
      return data.map(order => ({
        ...order,
        distribution_date: order.distribution_schedule?.distribution_date,
        dis_number: order.distribution_schedule?.dis_number,
        nahag_name: order.distribution_schedule?.nahag_name,
      }));
    }
  });

  // Fetch archived returns with driver names
  const { data: archivedReturns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ['archived-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select(`
          returnnumber,
          customername,
          address,
          city,
          totalreturn,
          done_return,
          agentnumber,
          schedule_id,
          distribution_schedule!inner(
            distribution_date,
            dis_number,
            nahag_name
          )
        `)
        .not('done_return', 'is', null)
        .order('done_return', { ascending: false });
      
      if (error) throw error;
      
      return data.map(returnItem => ({
        ...returnItem,
        distribution_date: returnItem.distribution_schedule?.distribution_date,
        dis_number: returnItem.distribution_schedule?.dis_number,
        nahag_name: returnItem.distribution_schedule?.nahag_name,
      }));
    }
  });

  // Group orders by invoice number
  const groupedOrders = archivedOrders.reduce((acc, order) => {
    if (order.invoicenumber) {
      if (!acc[order.invoicenumber]) {
        acc[order.invoicenumber] = [];
      }
      acc[order.invoicenumber].push(order);
    } else {
      // Orders without invoice numbers get their own group
      acc[`no-invoice-${order.ordernumber}`] = [order];
    }
    return acc;
  }, {} as Record<string, ArchivedOrder[]>);

  // Filter function
  const filterItems = (items: (ArchivedOrder | ArchivedReturn)[]) => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.customername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ('ordernumber' in item ? item.ordernumber.toString().includes(searchTerm) : item.returnnumber.toString().includes(searchTerm));
      
      const matchesDate = !selectedDate || 
        ('done_mainorder' in item ? 
          new Date(item.done_mainorder).toDateString() === selectedDate.toDateString() :
          new Date(item.done_return).toDateString() === selectedDate.toDateString());
      
      return matchesSearch && matchesDate;
    });
  };

  const filteredGroupedOrders = Object.entries(groupedOrders)
    .filter(([_, orders]) => filterItems(orders).length > 0)
    .reduce((acc, [invoiceNumber, orders]) => {
      acc[invoiceNumber] = filterItems(orders) as ArchivedOrder[];
      return acc;
    }, {} as Record<string, ArchivedOrder[]>);

  const filteredReturns = filterItems(archivedReturns) as ArchivedReturn[];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate(undefined);
  };

  if (ordersLoading || returnsLoading) {
    return <div className="p-6">טוען...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">ארכיון הזמנות והחזרות</h1>
        
        {/* Filters */}
        <div className="flex gap-4 mb-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search">חיפוש</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="חפש לפי שם לקוח, עיר או מספר הזמנה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          
          <div>
            <Label>תאריך</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-right"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: he }) : 'בחר תאריך'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {(searchTerm || selectedDate) && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              נקה סינון
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Archived Orders */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            הזמנות מועצות ({Object.keys(filteredGroupedOrders).length})
          </h2>
          
          <div className="grid gap-4">
            {Object.entries(filteredGroupedOrders).map(([invoiceKey, orders]) => {
              const hasInvoice = !invoiceKey.startsWith('no-invoice-');
              const isComplexInvoice = hasInvoice && orders.length > 1;
              
              return (
                <Card key={invoiceKey} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {hasInvoice && (
                          <>
                            חשבונית #{invoiceKey}
                            {isComplexInvoice && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                חשבונית מורכבת מכמה הזמנות
                              </Badge>
                            )}
                          </>
                        )}
                        {!hasInvoice && `הזמנה #${orders[0].ordernumber}`}
                      </CardTitle>
                      {orders[0].invoicedate && (
                        <Badge variant="outline">
                          תאריך חשבונית: {new Date(orders[0].invoicedate).toLocaleDateString('he-IL')}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div key={order.ordernumber} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">הזמנה #{order.ordernumber}</div>
                              <div className="text-sm text-gray-600">{order.customername}</div>
                              <div className="text-sm text-gray-500">{order.address}, {order.city}</div>
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-lg">₪{order.totalorder.toLocaleString('he-IL')}</div>
                              {order.agentnumber && (
                                <div className="text-sm text-gray-600">סוכן: {order.agentnumber}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-6 text-sm text-gray-600 mt-2">
                            <div>
                              <span className="font-medium">הופק:</span> {new Date(order.done_mainorder).toLocaleDateString('he-IL')}
                            </div>
                            {order.distribution_date && (
                              <div>
                                <span className="font-medium">תאריך אספקה:</span> {new Date(order.distribution_date).toLocaleDateString('he-IL')}
                              </div>
                            )}
                            {order.dis_number && (
                              <div>
                                <span className="font-medium">מספר הפצה:</span> #{order.dis_number}
                              </div>
                            )}
                            {order.schedule_id && (
                              <div>
                                <span className="font-medium">לוח זמנים:</span> #{order.schedule_id}
                              </div>
                            )}
                            {order.nahag_name && (
                              <div>
                                <span className="font-medium">נהג:</span> {order.nahag_name}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Archived Returns */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            החזרות מועצות ({filteredReturns.length})
          </h2>
          
          <div className="grid gap-4">
            {filteredReturns.map((returnItem) => (
              <Card key={returnItem.returnnumber} className="border">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">החזרה #{returnItem.returnnumber}</div>
                      <div className="text-sm text-gray-600">{returnItem.customername}</div>
                      <div className="text-sm text-gray-500">{returnItem.address}, {returnItem.city}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg text-red-600">₪{returnItem.totalreturn.toLocaleString('he-IL')}</div>
                      {returnItem.agentnumber && (
                        <div className="text-sm text-gray-600">סוכן: {returnItem.agentnumber}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-6 text-sm text-gray-600 mt-2">
                    <div>
                      <span className="font-medium">הופק:</span> {new Date(returnItem.done_return).toLocaleDateString('he-IL')}
                    </div>
                    {returnItem.distribution_date && (
                      <div>
                        <span className="font-medium">תאריך אספקה:</span> {new Date(returnItem.distribution_date).toLocaleDateString('he-IL')}
                      </div>
                    )}
                    {returnItem.dis_number && (
                      <div>
                        <span className="font-medium">מספר הפצה:</span> #{returnItem.dis_number}
                      </div>
                    )}
                    {returnItem.schedule_id && (
                      <div>
                        <span className="font-medium">לוח זמנים:</span> #{returnItem.schedule_id}
                      </div>
                    )}
                    {returnItem.nahag_name && (
                      <div>
                        <span className="font-medium">נהג:</span> {returnItem.nahag_name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
