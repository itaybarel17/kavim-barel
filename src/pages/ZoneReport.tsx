
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

  return (
    <div className="min-h-screen bg-background">
      {/* Action buttons - visible only on screen */}
      <div className="no-print sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/distribution')}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          חזור לממשק הפצה
        </Button>
        <div className="flex gap-2" data-hide-in-export>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            הדפס
          </Button>
          <Button
            onClick={handleExportToPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            ייצא ל-PDF
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div ref={reportRef} className="p-8 max-w-4xl mx-auto bg-white">
        {/* Header */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">
            דוח אזור {zoneNumber}
          </h1>
          <h2 className="text-2xl text-muted-foreground">
            {groupName || 'לא מוגדר'}
          </h2>
        </div>

        {/* Schedule Info */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="text-xl">פרטי לוח זמנים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">מזהה לוח זמנים:</span> {scheduleId}
              </div>
              <div>
                <span className="font-semibold">נהג:</span> {driverName || 'לא מוגדר'}
              </div>
              <div>
                <span className="font-semibold">תאריך הדפסה:</span>{' '}
                {new Date().toLocaleDateString('he-IL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
              <div>
                <span className="font-semibold">שעת הדפסה:</span>{' '}
                {new Date().toLocaleTimeString('he-IL', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Section */}
        {orders.length > 0 && (
          <Card className="mb-8 border-2 border-blue-300">
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">
                הזמנות ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <div
                    key={`order-${order.ordernumber}`}
                    className="p-4 border-2 border-blue-300 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-blue-900">
                        {index + 1}. {order.customername}
                      </h3>
                      <span className="text-lg font-bold text-blue-700">
                        ₪{order.totalorder.toLocaleString('he-IL')}
                      </span>
                    </div>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>
                        <span className="font-medium">כתובת:</span> {order.address}, {order.city}
                      </div>
                      <div>
                        <span className="font-medium">מספר הזמנה:</span> {order.ordernumber}
                      </div>
                      {order.invoicenumber && (
                        <div>
                          <span className="font-medium">מספר חשבונית:</span> {order.invoicenumber}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Returns Section */}
        {returns.length > 0 && (
          <Card className="mb-8 border-2 border-red-300">
            <CardHeader>
              <CardTitle className="text-xl text-red-700">
                החזרות ({returns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returns.map((returnItem, index) => (
                  <div
                    key={`return-${returnItem.returnnumber}`}
                    className="p-4 border-2 border-red-300 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-red-900">
                        {index + 1}. {returnItem.customername}
                      </h3>
                      <span className="text-lg font-bold text-red-700">
                        ₪{returnItem.totalreturn.toLocaleString('he-IL')}
                      </span>
                    </div>
                    <div className="text-sm text-red-800 space-y-1">
                      <div>
                        <span className="font-medium">כתובת:</span> {returnItem.address}, {returnItem.city}
                      </div>
                      <div>
                        <span className="font-medium">מספר החזרה:</span> {returnItem.returnnumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary - Always on one page */}
        <div className="page-break-before">
          <Card className="border-2 border-green-400">
            <CardHeader>
              <CardTitle className="text-xl text-green-800">
                סיכום אזור {zoneNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                <div className="text-blue-700 p-4 border-2 border-blue-300 rounded-lg">
                  <span className="font-semibold">סך הכל הזמנות:</span><br />
                  {orders.length} פריטים • ₪{totalOrdersAmount.toLocaleString('he-IL')}
                </div>
                <div className="text-red-700 p-4 border-2 border-red-300 rounded-lg">
                  <span className="font-semibold">סך הכל החזרות:</span><br />
                  {returns.length} פריטים • ₪{totalReturnsAmount.toLocaleString('he-IL')}
                </div>
                <div className="text-green-800 font-bold text-xl p-4 border-2 border-green-400 rounded-lg">
                  <span className="font-semibold">סך הכל נטו:</span><br />
                  ₪{netTotal.toLocaleString('he-IL')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .page-break-before {
            page-break-before: always;
          }
          .page-break-after {
            page-break-after: always;
          }
          .page-break-inside {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default ZoneReport;
