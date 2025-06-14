
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Printer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ActionButtonsProps {
  onNavigateBack: () => void;
  onPrint: () => void;
  onExportToPDF: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onNavigateBack,
  onPrint,
  onExportToPDF
}) => {
  const { user } = useAuth();
  const isAdmin = user?.agentnumber === "4";

  return (
    <div className="no-print sticky top-0 z-10 bg-background border-b p-2 flex items-center justify-between">
      {isAdmin && (
        <Button
          variant="outline"
          onClick={onNavigateBack}
          className="flex items-center gap-2 text-sm"
          size="sm"
        >
          <ArrowRight className="h-3 w-3 rotate-180" />
          חזור לממשק הפצה
        </Button>
      )}
      <div className={`flex gap-2 ${!isAdmin ? 'ml-auto' : ''}`} data-hide-in-export>
        <Button
          onClick={onPrint}
          variant="outline"
          className="flex items-center gap-2 text-sm"
          size="sm"
        >
          <Printer className="h-3 w-3" />
          הדפס
        </Button>
        <Button
          onClick={onExportToPDF}
          className="flex items-center gap-2 text-sm"
          size="sm"
        >
          <Download className="h-3 w-3" />
          ייצא ל-PDF
        </Button>
      </div>
    </div>
  );
};
