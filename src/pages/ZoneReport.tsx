
import React, { useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
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
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
}

interface ZoneReportData {
  zoneNumber: number;
  scheduleId: number;
  groupName: string;
  driverName: string;
  orders: Order[];
  returns: Return[];
}

interface CombinedItem {
  type: 'order' | 'return' | 'returns-header';
  data?: Order | Return;
  index?: number;
}

const ZoneReport = () => {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);

  // Get data from location state
  const reportData = location.state as ZoneReportData;

  if (!reportData) {
    return (
      <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">לא נמצאו נתונים לדוח</p>
          <Button onClick={() => navigate('/distribution')}>
            חזור לממשק הפצה
          </Button>
        </div>
      </div>
    );
  }

  const { zoneNumber, scheduleId, groupName, driverName, orders, returns } = reportData;

  // Calculate totals
  const totalOrdersAmount = orders.reduce((sum, order) => sum + order.totalorder, 0);
  const totalReturnsAmount = returns.reduce((sum, returnItem) => sum + returnItem.totalreturn, 0);
  const netTotal = totalOrdersAmount - totalReturnsAmount;

  // Create combined items list - orders first, then returns header, then returns
  const combinedItems: CombinedItem[] = [
    ...orders.map((order, index) => ({ type: 'order' as const, data: order, index: index + 1 })),
    ...(returns.length > 0 ? [{ type: 'returns-header' as const }] : []),
    ...returns.map((returnItem, index) => ({ type: 'return' as const, data: returnItem, index: index + 1 }))
  ];

  // Split combined items into two columns
  const midPoint = Math.ceil(combinedItems.length / 2);
  const leftColumn = combinedItems.slice(0, midPoint);
  const rightColumn = combinedItems.slice(midPoint);

  const handleExportToPDF = async () => {
    if (!reportRef.current) return;

    try {
      // Hide buttons before capturing
      const buttons = reportRef.current.querySelectorAll('[data-hide-in-export]');
      buttons.forEach(button => {
        (button as HTMLElement).style.display = 'none';
      });

      // Capture the element as canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Show buttons again
      buttons.forEach(button => {
        (button as HTMLElement).style.display = '';
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`אזור-${zoneNumber}-דוח-${new Date().toLocaleDateString('he-IL')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderItem = (item: CombinedItem) => {
    if (item.type === 'returns-header') {
      return (
        <div key="returns-header" className="mb-2">
          <h3 className="text-sm font-bold text-red-700 border-b border-red-300 pb-1">
            החזרות ({returns.length})
          </h3>
        </div>
      );
    }

    const isOrder = item.type === 'order';
    const data = item.data!;
    const order = data as Order;
    const returnItem = data as Return;
    
    return (
      <div
        key={`${item.type}-${isOrder ? order.ordernumber : returnItem.returnnumber}`}
        className={`p-1 border rounded text-xs mb-1 ${
          isOrder ? 'border-blue-300' : 'border-red-300'
        }`}
      >
        <div className="flex items-start justify-between mb-1">
          <span className={`font-medium text-xs ${
            isOrder ? 'text-blue-900' : 'text-red-900'
          }`}>
            {item.index}. {data.customername}
          </span>
          <span className={`font-bold text-xs ${
            isOrder ? 'text-blue-700' : 'text-red-700'
          }`}>
            ₪{isOrder ? order.totalorder.toLocaleString('he-IL') : returnItem.totalreturn.toLocaleString('he-IL')}
          </span>
        </div>
        <div className={`text-xs ${isOrder ? 'text-blue-800' : 'text-red-800'}`}>
          <div>{data.address}, {data.city}</div>
          <div>
            {isOrder ? 'הזמנה' : 'החזרה'}: {isOrder ? order.ordernumber : returnItem.returnnumber}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Action buttons - visible only on screen */}
      <div className="no-print sticky top-0 z-10 bg-background border-b p-2 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/distribution')}
          className="flex items-center gap-2 text-sm"
          size="sm"
        >
          <ArrowRight className="h-3 w-3 rotate-180" />
          חזור לממשק הפצה
        </Button>
        <div className="flex gap-2" data-hide-in-export>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <Printer className="h-3 w-3" />
            הדפס
          </Button>
          <Button
            onClick={handleExportToPDF}
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <Download className="h-3 w-3" />
            ייצא ל-PDF
          </Button>
        </div>
      </div>

      {/* Report content - optimized for single page */}
      <div ref={reportRef} className="p-3 max-w-4xl mx-auto bg-white text-xs">
        {/* Header merged with Schedule Info - compact */}
        <Card className="mb-3 border">
          <CardHeader className="pb-2">
            <div className="text-center mb-2">
              <CardTitle className="text-lg font-bold text-primary mb-1">
                דוח אזור {zoneNumber}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {groupName || 'לא מוגדר'}
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

        {/* Combined Orders and Returns in Two Columns */}
        {combinedItems.length > 0 && (
          <Card className="mb-3 border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                הזמנות וחזרות - סה"כ {orders.length + returns.length} פריטים
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {/* Left Column */}
                <div className="space-y-1">
                  {leftColumn.map(renderItem)}
                </div>
                
                {/* Right Column */}
                <div className="space-y-1">
                  {rightColumn.map(renderItem)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary - compact, no page break */}
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
                <div>{orders.length} פריטים</div>
                <div className="font-bold">₪{totalOrdersAmount.toLocaleString('he-IL')}</div>
              </div>
              <div className="text-red-700 p-2 border border-red-300 rounded">
                <div className="font-medium">סך הכל החזרות:</div>
                <div>{returns.length} פריטים</div>
                <div className="font-bold">₪{totalReturnsAmount.toLocaleString('he-IL')}</div>
              </div>
              <div className="text-green-800 p-2 border border-green-400 rounded">
                <div className="font-medium">סך הכל נטו:</div>
                <div className="font-bold text-lg">₪{netTotal.toLocaleString('he-IL')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print styles - optimized for single page */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            font-size: 10px;
          }
          @page {
            margin: 0.5cm;
            size: A4;
          }
          .page-break-before {
            page-break-before: avoid;
          }
          .page-break-after {
            page-break-after: avoid;
          }
          .page-break-inside {
            page-break-inside: avoid;
          }
          /* Force everything to fit on one page */
          * {
            page-break-inside: avoid;
            page-break-before: avoid;
            page-break-after: avoid;
          }
          /* Reduce spacing even more for print */
          .space-y-1 > * + * {
            margin-top: 0.125rem;
          }
          .mb-3 {
            margin-bottom: 0.5rem;
          }
          .p-3 {
            padding: 0.5rem;
          }
          .gap-3 {
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ZoneReport;
