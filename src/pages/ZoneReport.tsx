import React, { useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { ReportHeader } from '@/components/zone-report/ReportHeader';
import { CombinedItemsList } from '@/components/zone-report/CombinedItemsList';
import { SummarySection } from '@/components/zone-report/SummarySection';
import { ActionButtons } from '@/components/zone-report/ActionButtons';
import {
  ZoneReportData,
  sortOrdersByLocationAndCustomer,
  sortReturnsByLocationAndCustomer,
  createNumberedOrdersList,
  createCombinedItemsList,
  calculateTotals
} from '@/components/zone-report/utils';

const ZoneReport = () => {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);

  // Get data from location state
  const reportData = location.state as ZoneReportData & { customerSupplyMap?: Record<string, string> };

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

  const { zoneNumber, scheduleId, groupName, driverName, orders, returns, customerSupplyMap = {} } = reportData;

  // Process data with sorting and numbering
  const sortedOrders = sortOrdersByLocationAndCustomer(orders);
  const sortedReturns = sortReturnsByLocationAndCustomer(returns);
  const numberedOrders = createNumberedOrdersList(sortedOrders);
  const numberedOrdersCount = numberedOrders.filter(order => order.displayIndex).length;
  const combinedItems = createCombinedItemsList(numberedOrders, sortedReturns);
  const { totalOrdersAmount, totalReturnsAmount, netTotal } = calculateTotals(orders, returns);

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

  const handleNavigateBack = () => {
    navigate('/distribution');
  };

  return (
    <div className="min-h-screen bg-background">
      <ActionButtons
        onNavigateBack={handleNavigateBack}
        onPrint={handlePrint}
        onExportToPDF={handleExportToPDF}
      />

      {/* Report content - optimized for single page */}
      <div ref={reportRef} className="p-3 max-w-4xl mx-auto bg-white text-xs">
        <ReportHeader
          zoneNumber={zoneNumber}
          scheduleId={scheduleId}
          groupName={groupName}
          driverName={driverName}
        />

        <CombinedItemsList
          combinedItems={combinedItems}
          numberedOrdersCount={numberedOrdersCount}
          returnsCount={returns.length}
          customerSupplyMap={customerSupplyMap}
        />

        <SummarySection
          zoneNumber={zoneNumber}
          numberedOrdersCount={numberedOrdersCount}
          returnsCount={returns.length}
          totalOrdersAmount={totalOrdersAmount}
          totalReturnsAmount={totalReturnsAmount}
          netTotal={netTotal}
        />
      </div>

      {/* Print styles - optimized for single page */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          /* Hide navigation and header elements during print */
          nav, .navbar, header, .header {
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
