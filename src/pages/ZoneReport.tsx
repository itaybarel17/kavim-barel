
import React, { useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { ReportHeader } from '@/components/zone-report/ReportHeader';
import { CombinedItemsList } from '@/components/zone-report/CombinedItemsList';
import { SummarySection } from '@/components/zone-report/SummarySection';
import { ActionButtons } from '@/components/zone-report/ActionButtons';
import { supabase } from '@/integrations/supabase/client';
import {
  ZoneReportData,
  sortOrdersByLocationAndCustomer,
  sortReturnsByLocationAndCustomer,
  createNumberedOrdersList,
  createCombinedItemsList,
  calculateTotals,
  Order,
  Return
} from '@/components/zone-report/utils';
import {
  getReplacementCustomerDetails,
  getCustomerReplacementMap,
  type CustomerReplacement
} from '@/utils/scheduleUtils';

const ZoneReport = () => {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);

  // Get data from location state - properly destructure customerSupplyMap
  const reportData = location.state as ZoneReportData & { customerSupplyMap?: Record<string, string> };

  if (!reportData) {
    return (
      <div className="p-6 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">לא נמצאו נתונים לדוח</p>
          <Button onClick={() => navigate('/distribution')}>
            חזור לממשק הפצה
          </Button>
        </div>
      </div>
    );
  }

  // Properly destructure customerSupplyMap with default empty object
  const { zoneNumber, scheduleId, groupName, driverName, orders, returns, customerSupplyMap = {} } = reportData;

  // Fetch customer replacement data
  const { data: customerReplacements = [] } = useQuery({
    queryKey: ['customer-replacements-zone', scheduleId],
    queryFn: async () => {
      if (!scheduleId || (!orders.length && !returns.length)) return [];
      
      const orderNumbers = orders.map(o => o.ordernumber);
      const returnNumbers = returns.map(r => r.returnnumber);
      
      if (orderNumbers.length === 0 && returnNumbers.length === 0) return [];
      
      // Get all "order on another customer" messages for these orders/returns
      const { data: messages, error } = await supabase
        .from('messages')
        .select('ordernumber, returnnumber, correctcustomer, city')
        .eq('subject', 'הזמנה על לקוח אחר')
        .not('correctcustomer', 'is', null)
        .or(`ordernumber.in.(${orderNumbers.join(',')}),returnnumber.in.(${returnNumbers.join(',')})`);
      
      if (error) throw error;
      if (!messages || messages.length === 0) return [];
      
      // Get customer details for all replacement customers
      const correctCustomerNames = [...new Set(messages.map(m => m.correctcustomer).filter(Boolean))];
      
      const { data: existingCustomers, error: customerError } = await supabase
        .from('customerlist')
        .select('customername, customernumber, address, city, mobile, phone, supplydetails')
        .in('customername', correctCustomerNames);
      
      if (customerError) throw customerError;
      
      // Create customer lookup map
      const customerMap = new globalThis.Map(existingCustomers?.map(c => [c.customername, c]) || []);
      
      // Build replacement data
      const replacements: CustomerReplacement[] = messages.map(msg => ({
        ordernumber: msg.ordernumber,
        returnnumber: msg.returnnumber,
        correctcustomer: msg.correctcustomer,
        city: msg.city,
        existsInSystem: customerMap.has(msg.correctcustomer),
        customerData: customerMap.get(msg.correctcustomer) ? {
          customername: customerMap.get(msg.correctcustomer)!.customername,
          customernumber: customerMap.get(msg.correctcustomer)!.customernumber,
          address: customerMap.get(msg.correctcustomer)!.address,
          city: customerMap.get(msg.correctcustomer)!.city,
          mobile: customerMap.get(msg.correctcustomer)!.mobile,
          phone: customerMap.get(msg.correctcustomer)!.phone,
          supplydetails: customerMap.get(msg.correctcustomer)!.supplydetails,
        } : undefined
      }));
      
      return replacements;
    },
    enabled: !!scheduleId && (orders.length > 0 || returns.length > 0)
  });

  // Create replacement map
  const replacementMap = useMemo(() => {
    return getCustomerReplacementMap(customerReplacements);
  }, [customerReplacements]);

  // Apply customer replacements to orders and returns
  const processedOrders = useMemo(() => {
    return orders.map(order => {
      const replacementDetails = getReplacementCustomerDetails(order, replacementMap);
      return {
        ...order,
        customername: replacementDetails.customername,
        address: replacementDetails.address || order.address,
        city: replacementDetails.city || order.city,
        customernumber: replacementDetails.customernumber || order.customernumber
      };
    });
  }, [orders, replacementMap]);

  const processedReturns = useMemo(() => {
    return returns.map(returnItem => {
      const replacementDetails = getReplacementCustomerDetails(returnItem, replacementMap);
      return {
        ...returnItem,
        customername: replacementDetails.customername,
        address: replacementDetails.address || returnItem.address,
        city: replacementDetails.city || returnItem.city,
        customernumber: replacementDetails.customernumber || returnItem.customernumber
      };
    });
  }, [returns, replacementMap]);

  // Process data with sorting and numbering using processed orders/returns
  const sortedOrders = sortOrdersByLocationAndCustomer(processedOrders);
  const sortedReturns = sortReturnsByLocationAndCustomer(processedReturns);
  const numberedOrders = createNumberedOrdersList(sortedOrders);
  const numberedOrdersCount = numberedOrders.filter(order => order.displayIndex).length;
  const combinedItems = createCombinedItemsList(numberedOrders, sortedReturns);
  const { totalOrdersAmount, totalReturnsAmount, netTotal } = calculateTotals(processedOrders, processedReturns);

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
    <div className="bg-background">
      <ActionButtons
        onNavigateBack={handleNavigateBack}
        onPrint={handlePrint}
        onExportToPDF={handleExportToPDF}
      />

      {/* Report content - natural sizing */}
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

      {/* Print styles - natural sizing */}
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
          /* Natural spacing for print */
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
