import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { ReturnReasonDialog } from '@/components/archive/ReturnReasonDialog';

interface ArchivedOrder {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  orderdate: string;
  invoicenumber?: number;
  invoicedate?: string;
  totalinvoice?: number;
  customernumber?: string;
  agentnumber?: string;
  done_mainorder: string;
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
  returndate: string;
  customernumber?: string;
  agentnumber?: string;
  done_return: string;
  return_reason?: any;
  distribution_date?: string;
  dis_number?: number;
  schedule_id?: number;
  nahag_name?: string;
}

const Archive = () => {
  const [orders, setOrders] = useState<ArchivedOrder[]>([]);
  const [returns, setReturns] = useState<ArchivedReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showReturns, setShowReturns] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ArchivedReturn | null>(null);
  const [returnReasonDialogOpen, setReturnReasonDialogOpen] = useState(false);

  useEffect(() => {
    fetchArchivedData();
  }, []);

  const fetchArchivedData = async () => {
    setLoading(true);
    try {
      // Fetch archived orders with distribution schedule data
      const { data: ordersData, error: ordersError } = await supabase
        .from('mainorder')
        .select(`
          ordernumber,
          customername,
          address,
          city,
          totalorder,
          orderdate,
          invoicenumber,
          invoicedate,
          totalinvoice,
          customernumber,
          agentnumber,
          done_mainorder,
          schedule_id,
          distribution_schedule!inner(
            distribution_date,
            dis_number,
            nahag_name
          )
        `)
        .not('done_mainorder', 'is', null)
        .order('done_mainorder', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch archived returns with distribution schedule data
      const { data: returnsData, error: returnsError } = await supabase
        .from('mainreturns')
        .select(`
          returnnumber,
          customername,
          address,
          city,
          totalreturn,
          returndate,
          customernumber,
          agentnumber,
          done_return,
          return_reason,
          schedule_id,
          distribution_schedule!inner(
            distribution_date,
            dis_number,
            nahag_name
          )
        `)
        .not('done_return', 'is', null)
        .order('done_return', { ascending: false });

      if (returnsError) throw returnsError;

      // Flatten the data to include distribution schedule fields
      const flattenedOrders = ordersData?.map(order => ({
        ...order,
        distribution_date: order.distribution_schedule?.distribution_date,
        dis_number: order.distribution_schedule?.dis_number,
        nahag_name: order.distribution_schedule?.nahag_name
      })) || [];

      const flattenedReturns = returnsData?.map(returnItem => ({
        ...returnItem,
        distribution_date: returnItem.distribution_schedule?.distribution_date,
        dis_number: returnItem.distribution_schedule?.dis_number,
        nahag_name: returnItem.distribution_schedule?.nahag_name
      })) || [];

      setOrders(flattenedOrders);
      setReturns(flattenedReturns);
    } catch (error) {
      console.error('Error fetching archived data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (orders: ArchivedOrder[]) => {
    return orders.filter(order => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        order.customername.toLowerCase().includes(searchTermLower) ||
        order.address.toLowerCase().includes(searchTermLower) ||
        order.city.toLowerCase().includes(searchTermLower) ||
        order.ordernumber.toString().includes(searchTermLower) ||
        (order.invoicenumber?.toString().includes(searchTermLower) ?? false)
      );
    });
  };

  const filterReturns = (returns: ArchivedReturn[]) => {
    return returns.filter(returnItem => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        returnItem.customername.toLowerCase().includes(searchTermLower) ||
        returnItem.address.toLowerCase().includes(searchTermLower) ||
        returnItem.city.toLowerCase().includes(searchTermLower) ||
        returnItem.returnnumber.toString().includes(searchTermLower)
      );
    });
  };

  const sortOrders = (orders: ArchivedOrder[]) => {
    let sortedOrders = [...orders];
    sortedOrders = sortedOrders.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.orderdate).getTime();
        const dateB = new Date(b.orderdate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'customer') {
        const customerA = a.customername.toLowerCase();
        const customerB = b.customername.toLowerCase();
        return sortOrder === 'asc' ? customerA.localeCompare(customerB) : customerB.localeCompare(customerA);
      } else if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.totalorder - b.totalorder : b.totalorder - a.totalorder;
      }
      return 0;
    });
    return sortedOrders;
  };

  const sortReturns = (returns: ArchivedReturn[]) => {
    let sortedReturns = [...returns];
    sortedReturns = sortedReturns.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.returndate).getTime();
        const dateB = new Date(b.returndate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'customer') {
        const customerA = a.customername.toLowerCase();
        const customerB = b.customername.toLowerCase();
        return sortOrder === 'asc' ? customerA.localeCompare(customerB) : customerB.localeCompare(customerA);
      } else if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.totalreturn - b.totalreturn : b.totalreturn - a.totalreturn;
      }
      return 0;
    });
    return sortedReturns;
  };

  const filterByDate = (orders: ArchivedOrder[], returns: ArchivedReturn[]) => {
    if (!selectedDate) {
      return {
        filteredOrders: orders,
        filteredReturns: returns,
      };
    }

    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderdate);
      return orderDate >= selectedDateStart && orderDate <= selectedDateEnd;
    });

    const filteredReturns = returns.filter(returnItem => {
      const returnDate = new Date(returnItem.returndate);
      return returnDate >= selectedDateStart && returnDate <= selectedDateEnd;
    });

    return {
      filteredOrders,
      filteredReturns,
    };
  };

  const filteredOrders = filterOrders(orders);
  const filteredReturns = filterReturns(returns);
  const { filteredOrders: dateFilteredOrders, filteredReturns: dateFilteredReturns } = filterByDate(filteredOrders, filteredReturns);
  const sortedOrdersResult = sortOrders(dateFilteredOrders);
  const sortedReturnsResult = sortReturns(dateFilteredReturns);

  const filteredAndSortedOrders = sortedOrdersResult;
  const filteredAndSortedReturns = sortedReturnsResult;

  const handleReturnReasonClick = (returnItem: ArchivedReturn) => {
    setSelectedReturn(returnItem);
    setReturnReasonDialogOpen(true);
  };

  // Group orders by invoice number
  const groupOrdersByInvoice = (orders: ArchivedOrder[]) => {
    const grouped: { [key: string]: ArchivedOrder[] } = {};
    const ungrouped: ArchivedOrder[] = [];

    orders.forEach(order => {
      if (order.invoicenumber) {
        const key = order.invoicenumber.toString();
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(order);
      } else {
        ungrouped.push(order);
      }
    });

    return { grouped, ungrouped };
  };

  const { grouped: groupedOrders, ungrouped: ungroupedOrders } = groupOrdersByInvoice(filteredAndSortedOrders);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ארכיון הזמנות והחזרות</h1>
        <Button
          variant="outline"
          onClick={() => setShowReturns(!showReturns)}
          className="flex items-center gap-2"
        >
          {showReturns ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showReturns ? 'הסתר החזרות' : 'הצג החזרות'}
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row items-center">
        <Input
          type="text"
          placeholder="חפש הזמנות/החזרות..."
          className="w-full md:w-auto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'customer' | 'amount')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="מיין לפי" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">תאריך</SelectItem>
              <SelectItem value="customer">לקוח</SelectItem>
              <SelectItem value="amount">סכום</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="סדר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">עולה</SelectItem>
              <SelectItem value="desc">יורד</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={
                "h-10 w-[200px] justify-start text-left font-normal" +
                (selectedDate ? " text-primary" : " text-muted-foreground")
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "dd/MM/yyyy", { locale: he })
              ) : (
                <span>בחר תאריך</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              locale={he}
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) =>
                date > new Date() || date < new Date("2023-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-6">
        {/* Grouped Orders (with invoice numbers) */}
        {Object.entries(groupedOrders).map(([invoiceNumber, invoiceOrders]) => (
          <div key={`invoice-${invoiceNumber}`} className="space-y-2">
            {invoiceOrders.length > 1 && (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                <h3 className="text-lg font-bold text-blue-800">
                  חשבונית מורכבת מכמה הזמנות - חשבונית #{invoiceNumber}
                </h3>
              </div>
            )}
            {invoiceOrders.map((order) => (
              <Card key={`order-${order.ordernumber}`} className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-blue-600">
                        הזמנה #{order.ordernumber}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        {order.orderdate && format(new Date(order.orderdate), 'dd/MM/yyyy', { locale: he })}
                      </div>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="text-lg font-bold text-blue-600">
                        ₪{order.totalorder?.toLocaleString('he-IL')}
                      </div>
                      {order.agentnumber && (
                        <div className="text-sm text-muted-foreground">
                          סוכן: {order.agentnumber}
                        </div>
                      )}
                      {order.customernumber && (
                        <div className="text-sm text-muted-foreground">
                          לקוח: {order.customernumber}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-medium text-blue-800">{order.customername}</h3>
                    <p className="text-sm text-muted-foreground">{order.address}</p>
                    <p className="text-sm text-muted-foreground">{order.city}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">הושלם:</span>
                        <span>{format(new Date(order.done_mainorder), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                      </div>
                      {order.distribution_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">תאריך אספקה:</span>
                          <span>{format(new Date(order.distribution_date), 'dd/MM/yyyy', { locale: he })}</span>
                        </div>
                      )}
                      {order.nahag_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">נהג:</span>
                          <span>{order.nahag_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {order.dis_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">מספר הפצה:</span>
                          <span>{order.dis_number}</span>
                        </div>
                      )}
                      {order.schedule_id && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">לוח זמנים:</span>
                          <span>{order.schedule_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {order.invoicenumber && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800 font-medium">חשבונית #{order.invoicenumber}</span>
                        <span className="text-green-800 font-bold">
                          ₪{order.totalinvoice?.toLocaleString('he-IL')}
                        </span>
                      </div>
                      {order.invoicedate && (
                        <div className="text-sm text-green-600 mt-1">
                          תאריך חשבונית: {format(new Date(order.invoicedate), 'dd/MM/yyyy', { locale: he })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

        {/* Ungrouped Orders (without invoice numbers) */}
        {ungroupedOrders.map((order) => (
          <Card key={`order-${order.ordernumber}`} className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-blue-600">
                    הזמנה #{order.ordernumber}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    {order.orderdate && format(new Date(order.orderdate), 'dd/MM/yyyy', { locale: he })}
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <div className="text-lg font-bold text-blue-600">
                    ₪{order.totalorder?.toLocaleString('he-IL')}
                  </div>
                  {order.agentnumber && (
                    <div className="text-sm text-muted-foreground">
                      סוכן: {order.agentnumber}
                    </div>
                  )}
                  {order.customernumber && (
                    <div className="text-sm text-muted-foreground">
                      לקוח: {order.customernumber}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium text-blue-800">{order.customername}</h3>
                <p className="text-sm text-muted-foreground">{order.address}</p>
                <p className="text-sm text-muted-foreground">{order.city}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">הושלם:</span>
                    <span>{format(new Date(order.done_mainorder), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                  </div>
                  {order.distribution_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">תאריך אספקה:</span>
                      <span>{format(new Date(order.distribution_date), 'dd/MM/yyyy', { locale: he })}</span>
                    </div>
                  )}
                  {order.nahag_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">נהג:</span>
                      <span>{order.nahag_name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {order.dis_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">מספר הפצה:</span>
                      <span>{order.dis_number}</span>
                    </div>
                  )}
                  {order.schedule_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">לוח זמנים:</span>
                      <span>{order.schedule_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Returns */}
        {showReturns && filteredAndSortedReturns.map((returnItem) => (
          <Card key={`return-${returnItem.returnnumber}`} className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-red-600">
                    החזרה #{returnItem.returnnumber}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    {returnItem.returndate && format(new Date(returnItem.returndate), 'dd/MM/yyyy', { locale: he })}
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <div className="text-lg font-bold text-red-600">
                    ₪{returnItem.totalreturn?.toLocaleString('he-IL')}
                  </div>
                  {returnItem.agentnumber && (
                    <div className="text-sm text-muted-foreground">
                      סוכן: {returnItem.agentnumber}
                    </div>
                  )}
                  {returnItem.customernumber && (
                    <div className="text-sm text-muted-foreground">
                      לקוח: {returnItem.customernumber}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium text-red-800">{returnItem.customername}</h3>
                <p className="text-sm text-muted-foreground">{returnItem.address}</p>
                <p className="text-sm text-muted-foreground">{returnItem.city}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">הושלם:</span>
                    <span>{format(new Date(returnItem.done_return), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                  </div>
                  {returnItem.distribution_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">תאריך אספקה:</span>
                      <span>{format(new Date(returnItem.distribution_date), 'dd/MM/yyyy', { locale: he })}</span>
                    </div>
                  )}
                  {returnItem.nahag_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">נהג:</span>
                      <span>{returnItem.nahag_name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {returnItem.dis_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">מספר הפצה:</span>
                      <span>{returnItem.dis_number}</span>
                    </div>
                  )}
                  {returnItem.schedule_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">לוח זמנים:</span>
                      <span>{returnItem.schedule_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {returnItem.return_reason && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReturnReasonClick(returnItem)}
                    className="text-yellow-800 hover:bg-yellow-100"
                  >
                    הצג סיבת החזרה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredAndSortedOrders.length === 0 && filteredAndSortedReturns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            לא נמצאו פריטים בארכיון
          </div>
        )}
      </div>

      <ReturnReasonDialog
        open={returnReasonDialogOpen}
        onOpenChange={setReturnReasonDialogOpen}
        returnItem={selectedReturn}
      />
    </div>
  );
};

export default Archive;
